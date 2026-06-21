import bcrypt from "bcryptjs";
import type { Db } from "./db/database.js";
import { eligibleMilestones } from "./services/milestones.js";
import type { FootprintInput } from "./types.js";

export function createRepositories(db: Db) {
  // Pre-prepare database statements for maximum efficiency
  const createUserStmt = db.prepare("INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)");
  const findUserByEmailStmt = db.prepare("SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ?");
  const findUserPublicByIdStmt = db.prepare("SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?");

  const createFootprintStmt = db.prepare(
    `INSERT INTO footprint_entries
      (user_id, entry_date, transport_km, transport_mode, electricity_kwh, gas_kwh, diet_type, meals, purchases_amount, notes, total_kg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const listFootprintsStmt = db.prepare(
    `SELECT id, entry_date AS entryDate, transport_km AS transportKm, transport_mode AS transportMode,
      electricity_kwh AS electricityKwh, gas_kwh AS gasKwh, diet_type AS dietType, meals,
      purchases_amount AS purchasesAmount, notes, total_kg AS totalKg, created_at AS createdAt
     FROM footprint_entries
     WHERE user_id = ?
     ORDER BY entry_date DESC, id DESC
     LIMIT ?`
  );
  const latestFootprintStmt = db.prepare(
    `SELECT entry_date AS entryDate, transport_km AS transportKm, transport_mode AS transportMode,
      electricity_kwh AS electricityKwh, gas_kwh AS gasKwh, diet_type AS dietType, meals,
      purchases_amount AS purchasesAmount, notes, total_kg AS totalKg
     FROM footprint_entries
     WHERE user_id = ?
     ORDER BY entry_date DESC, id DESC
     LIMIT 1`
  );

  const createActionStmt = db.prepare(
    `INSERT INTO eco_actions(user_id, action_date, category, description, estimated_savings_kg)
     VALUES (?, ?, ?, ?, ?)`
  );
  const listActionsStmt = db.prepare(
    `SELECT id, action_date AS actionDate, category, description,
      estimated_savings_kg AS estimatedSavingsKg, created_at AS createdAt
     FROM eco_actions
     WHERE user_id = ?
     ORDER BY action_date DESC, id DESC
     LIMIT ?`
  );

  const getStatsStmt = db.prepare(
    `SELECT
      COUNT(*) AS entriesCount,
      COALESCE(AVG(total_kg), 0) AS averageKg,
      COALESCE((SELECT total_kg FROM footprint_entries WHERE user_id = ? ORDER BY entry_date DESC, id DESC LIMIT 1), 0) AS latestKg
     FROM footprint_entries
     WHERE user_id = ?`
  );
  const getActionsStatsStmt = db.prepare(
    "SELECT COUNT(*) AS actionsCount, COALESCE(SUM(estimated_savings_kg), 0) AS savedKg FROM eco_actions WHERE user_id = ?"
  );
  const listMilestonesStmt = db.prepare(
    "SELECT code, title, achieved_at AS achievedAt FROM milestones WHERE user_id = ? ORDER BY achieved_at DESC"
  );
  const insertMilestoneStmt = db.prepare("INSERT OR IGNORE INTO milestones(user_id, code, title) VALUES (?, ?, ?)");

  return {
    users: {
      async create(name: string, email: string, password: string) {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = createUserStmt.run(name, email, passwordHash);
        return { id: Number(result.lastInsertRowid), name, email };
      },
      findByEmail(email: string) {
        return findUserByEmailStmt.get(email) as { id: number; name: string; email: string; passwordHash: string } | undefined;
      },
      findPublicById(id: number) {
        return findUserPublicByIdStmt.get(id);
      }
    },
    footprints: {
      create(userId: number, input: FootprintInput, totalKg: number) {
        const result = createFootprintStmt.run(
          userId,
          input.entryDate,
          input.transportKm,
          input.transportMode,
          input.electricityKwh,
          input.gasKwh,
          input.dietType,
          input.meals,
          input.purchasesAmount,
          input.notes ?? null,
          totalKg
        );
        return Number(result.lastInsertRowid);
      },
      list(userId: number, limit = 30) {
        return listFootprintsStmt.all(userId, limit);
      },
      latest(userId: number) {
        return latestFootprintStmt.get(userId) as (FootprintInput & { totalKg: number }) | undefined;
      }
    },
    actions: {
      create(userId: number, input: { actionDate: string; category: string; description: string; estimatedSavingsKg: number }) {
        const result = createActionStmt.run(userId, input.actionDate, input.category, input.description, input.estimatedSavingsKg);
        return Number(result.lastInsertRowid);
      },
      list(userId: number, limit = 20) {
        return listActionsStmt.all(userId, limit);
      }
    },
    progress: {
      summary(userId: number) {
        const stats = getStatsStmt.get(userId, userId) as { entriesCount: number; averageKg: number; latestKg: number };
        const actions = getActionsStatsStmt.get(userId) as { actionsCount: number; savedKg: number };
        const milestones = listMilestonesStmt.all(userId);
        return { ...stats, ...actions, milestones };
      },
      checkAndInsertMilestones(userId: number) {
        const stats = getStatsStmt.get(userId, userId) as { entriesCount: number; averageKg: number; latestKg: number };
        const actions = getActionsStatsStmt.get(userId) as { actionsCount: number; savedKg: number };
        const progressStats = { ...stats, ...actions };
        const eligible = eligibleMilestones(progressStats);
        if (eligible.length > 0) {
          const transaction = db.transaction((milestonesList) => {
            for (const milestone of milestonesList) {
              insertMilestoneStmt.run(userId, milestone.code, milestone.title);
            }
          });
          transaction(eligible);
        }
      }
    }
  };
}
