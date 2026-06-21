import bcrypt from "bcryptjs";
import type { Db } from "./db/database.js";
import { eligibleMilestones } from "./services/milestones.js";
import type { FootprintInput } from "./types.js";

export function createRepositories(db: Db) {
  return {
    users: {
      async create(name: string, email: string, password: string) {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = db
          .prepare("INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)")
          .run(name, email, passwordHash);
        return { id: Number(result.lastInsertRowid), name, email };
      },
      findByEmail(email: string) {
        return db
          .prepare("SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ?")
          .get(email) as { id: number; name: string; email: string; passwordHash: string } | undefined;
      },
      findPublicById(id: number) {
        return db.prepare("SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?").get(id);
      }
    },
    footprints: {
      create(userId: number, input: FootprintInput, totalKg: number) {
        const result = db
          .prepare(
            `INSERT INTO footprint_entries
              (user_id, entry_date, transport_km, transport_mode, electricity_kwh, gas_kwh, diet_type, meals, purchases_amount, notes, total_kg)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
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
        return db
          .prepare(
            `SELECT id, entry_date AS entryDate, transport_km AS transportKm, transport_mode AS transportMode,
              electricity_kwh AS electricityKwh, gas_kwh AS gasKwh, diet_type AS dietType, meals,
              purchases_amount AS purchasesAmount, notes, total_kg AS totalKg, created_at AS createdAt
             FROM footprint_entries
             WHERE user_id = ?
             ORDER BY entry_date DESC, id DESC
             LIMIT ?`
          )
          .all(userId, limit);
      },
      latest(userId: number) {
        return db
          .prepare(
            `SELECT entry_date AS entryDate, transport_km AS transportKm, transport_mode AS transportMode,
              electricity_kwh AS electricityKwh, gas_kwh AS gasKwh, diet_type AS dietType, meals,
              purchases_amount AS purchasesAmount, notes, total_kg AS totalKg
             FROM footprint_entries
             WHERE user_id = ?
             ORDER BY entry_date DESC, id DESC
             LIMIT 1`
          )
          .get(userId) as (FootprintInput & { totalKg: number }) | undefined;
      }
    },
    actions: {
      create(userId: number, input: { actionDate: string; category: string; description: string; estimatedSavingsKg: number }) {
        const result = db
          .prepare(
            `INSERT INTO eco_actions(user_id, action_date, category, description, estimated_savings_kg)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(userId, input.actionDate, input.category, input.description, input.estimatedSavingsKg);
        return Number(result.lastInsertRowid);
      },
      list(userId: number, limit = 20) {
        return db
          .prepare(
            `SELECT id, action_date AS actionDate, category, description,
              estimated_savings_kg AS estimatedSavingsKg, created_at AS createdAt
             FROM eco_actions
             WHERE user_id = ?
             ORDER BY action_date DESC, id DESC
             LIMIT ?`
          )
          .all(userId, limit);
      }
    },
    progress: {
      summary(userId: number) {
        const stats = db
          .prepare(
            `SELECT
              COUNT(*) AS entriesCount,
              COALESCE(AVG(total_kg), 0) AS averageKg,
              COALESCE((SELECT total_kg FROM footprint_entries WHERE user_id = ? ORDER BY entry_date DESC, id DESC LIMIT 1), 0) AS latestKg
             FROM footprint_entries
             WHERE user_id = ?`
          )
          .get(userId, userId) as { entriesCount: number; averageKg: number; latestKg: number };
        const actions = db
          .prepare("SELECT COUNT(*) AS actionsCount, COALESCE(SUM(estimated_savings_kg), 0) AS savedKg FROM eco_actions WHERE user_id = ?")
          .get(userId) as { actionsCount: number; savedKg: number };
        const progressStats = { ...stats, ...actions };
        const insert = db.prepare("INSERT OR IGNORE INTO milestones(user_id, code, title) VALUES (?, ?, ?)");
        for (const milestone of eligibleMilestones(progressStats)) {
          insert.run(userId, milestone.code, milestone.title);
        }
        const milestones = db
          .prepare("SELECT code, title, achieved_at AS achievedAt FROM milestones WHERE user_id = ? ORDER BY achieved_at DESC")
          .all(userId);
        return { ...progressStats, milestones };
      }
    }
  };
}
