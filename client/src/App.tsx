import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bike, CheckCircle2, Leaf, LogOut, Plus, Sparkles } from "lucide-react";
import { apiFetch, DashboardData, User } from "./api";

ChartJS.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement, Tooltip, Legend);

const today = new Date().toLocaleDateString("sv-SE");

const emptyDashboard: DashboardData = {
  entries: [],
  actions: [],
  progress: { entriesCount: 0, actionsCount: 0, averageKg: 0, latestKg: 0, savedKg: 0, milestones: [] },
  recommendations: [],
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    const data = await apiFetch<DashboardData>("/api/dashboard");
    setDashboard(data);
  }, []);

  useEffect(() => {
    apiFetch<{ user: User }>("/api/auth/me")
      .then(({ user }) => {
        setUser(user);
        return refreshDashboard();
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refreshDashboard]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? "")
    };
    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = authMode === "signup" ? payload : { email: payload.email, password: payload.password };
      const response = await apiFetch<{ user: User }>(endpoint, { method: "POST", body: JSON.stringify(body) });
      setUser(response.user);
      await refreshDashboard();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to authenticate");
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
    setUser(null);
    setDashboard(emptyDashboard);
  }

  if (loading) return <main className="center-shell">Loading Carbon Compass...</main>;

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="brand-mark" aria-hidden="true"><Leaf /></div>
          <h1 id="auth-title">Carbon Compass</h1>
          <p>Track everyday choices, learn your largest sources, and turn small actions into steady climate progress.</p>
          <div className="segmented" role="tablist" aria-label="Authentication mode">
            <button
              role="tab"
              aria-selected={authMode === "signup"}
              className={authMode === "signup" ? "active" : ""}
              onClick={() => setAuthMode("signup")}
              type="button"
            >
              Sign up
            </button>
            <button
              role="tab"
              aria-selected={authMode === "login"}
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Log in
            </button>
          </div>
          <form onSubmit={handleAuth} className="stacked-form">
            {authMode === "signup" && (
              <label>
                Name
                <input name="name" autoComplete="name" minLength={2} required />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={8} required />
            </label>
            {status && <p className="error" role="alert">{status}</p>}
            <button className="primary-button" type="submit">{authMode === "signup" ? "Create account" : "Log in"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal carbon tracker</p>
          <h1>Carbon Compass</h1>
        </div>
        <div className="user-cluster">
          <span>{user.name}</span>
          <button aria-label="Log out" className="icon-button" onClick={logout} type="button"><LogOut size={18} /></button>
        </div>
      </header>
      <Dashboard dashboard={dashboard} onRefresh={refreshDashboard} />
    </main>
  );
}

function Dashboard({ dashboard, onRefresh }: { dashboard: DashboardData; onRefresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");

  const chronological = useMemo(() => [...dashboard.entries].reverse(), [dashboard.entries]);
  const lineData = {
    labels: chronological.map((entry) => entry.entryDate),
    datasets: [
      {
        label: "kg CO2e",
        data: chronological.map((entry) => entry.totalKg),
        borderColor: "#0f766e",
        backgroundColor: "#0f766e",
        tension: 0.25
      }
    ]
  };
  const barData = {
    labels: ["Latest", "Average", "Saved"],
    datasets: [
      {
        label: "kg CO2e",
        data: [dashboard.progress.latestKg, dashboard.progress.averageKg, dashboard.progress.savedKg],
        backgroundColor: ["#0f766e", "#7c3aed", "#d97706"]
      }
    ]
  };

  async function submitFootprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      entryDate: String(form.get("entryDate")),
      transportKm: Number(form.get("transportKm")),
      transportMode: String(form.get("transportMode")),
      electricityKwh: Number(form.get("electricityKwh")),
      gasKwh: Number(form.get("gasKwh")),
      dietType: String(form.get("dietType")),
      meals: Number(form.get("meals")),
      purchasesAmount: Number(form.get("purchasesAmount")),
      notes: String(form.get("notes") ?? "")
    };
    await apiFetch("/api/footprints", { method: "POST", body: JSON.stringify(payload) });
    event.currentTarget.reset();
    setMessage("Footprint logged. Your recommendations have been refreshed.");
    await onRefresh();
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiFetch("/api/actions", {
      method: "POST",
      body: JSON.stringify({
        actionDate: String(form.get("actionDate")),
        category: String(form.get("category")),
        description: String(form.get("description")),
        estimatedSavingsKg: Number(form.get("estimatedSavingsKg"))
      })
    });
    event.currentTarget.reset();
    setMessage("Eco-action saved. Nice, measurable progress.");
    await onRefresh();
  }

  return (
    <div className="dashboard-grid">
      <section className="metric-band" aria-label="Carbon footprint summary">
        <Metric label="Latest footprint" value={`${dashboard.progress.latestKg.toFixed(1)} kg`} />
        <Metric label="30-day average" value={`${dashboard.progress.averageKg.toFixed(1)} kg`} />
        <Metric label="Eco-actions" value={String(dashboard.progress.actionsCount)} />
        <Metric label="Estimated saved" value={`${dashboard.progress.savedKg.toFixed(1)} kg`} />
      </section>

      <section className="panel chart-panel" aria-labelledby="trend-title">
        <h2 id="trend-title">Progress over time</h2>
        {chronological.length ? <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} /> : <EmptyState />}
      </section>

      <section className="panel chart-panel" aria-labelledby="compare-title">
        <h2 id="compare-title">Today in context</h2>
        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
      </section>

      <section className="panel" aria-labelledby="calculator-title">
        <h2 id="calculator-title"><Plus size={20} /> Daily calculator</h2>
        <form className="entry-form" onSubmit={submitFootprint}>
          <label>Date<input name="entryDate" type="date" defaultValue={today} required /></label>
          <label>Transport km<input name="transportKm" type="number" min="0" step="0.1" defaultValue="0" required /></label>
          <label>Mode<select name="transportMode" defaultValue="car"><option value="walk_bike">Walk or bike</option><option value="public_transit">Public transit</option><option value="car">Car</option><option value="electric_car">Electric car</option><option value="flight">Flight</option></select></label>
          <label>Electricity kWh<input name="electricityKwh" type="number" min="0" step="0.1" defaultValue="0" required /></label>
          <label>Gas kWh<input name="gasKwh" type="number" min="0" step="0.1" defaultValue="0" required /></label>
          <label>Diet<select name="dietType" defaultValue="mixed"><option value="plant_based">Plant based</option><option value="vegetarian">Vegetarian</option><option value="mixed">Mixed</option><option value="meat_heavy">Meat heavy</option></select></label>
          <label>Meals<input name="meals" type="number" min="0" max="12" defaultValue="3" required /></label>
          <label>Purchases amount<input name="purchasesAmount" type="number" min="0" step="1" defaultValue="0" required /></label>
          <label className="wide">Notes<textarea name="notes" rows={3} /></label>
          <button className="primary-button wide" type="submit">Calculate and save</button>
        </form>
        {message && <p className="success" role="status">{message}</p>}
      </section>

      <section className="panel" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title"><Sparkles size={20} /> Personalized insights</h2>
        <div className="recommendation-list">
          {dashboard.recommendations.map((item) => (
            <article className="recommendation-card" key={item.id}>
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <strong>{item.impactKg.toFixed(1)} kg potential saving</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="actions-title">
        <h2 id="actions-title"><Bike size={20} /> Action log</h2>
        <form className="action-form" onSubmit={submitAction}>
          <label>Date<input name="actionDate" type="date" defaultValue={today} required /></label>
          <label>Category<input name="category" placeholder="Transport" required /></label>
          <label className="wide">Action<input name="description" placeholder="Cycled to work" required /></label>
          <label>Saved kg<input name="estimatedSavingsKg" type="number" min="0" step="0.1" defaultValue="1" required /></label>
          <button className="primary-button" type="submit">Log action</button>
        </form>
        <ul className="plain-list">
          {dashboard.actions.map((action) => (
            <li key={action.id}><CheckCircle2 size={18} /> {action.actionDate}: {action.description} ({action.estimatedSavingsKg} kg)</li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="learn-title">
        <h2 id="learn-title">Learn the basics</h2>
        <p>Carbon dioxide equivalent, or CO2e, lets different greenhouse gases be compared in one simple unit. Your biggest daily levers are usually transport, home energy, food choices, and new purchases.</p>
        <p>Small repeatable actions matter because they become defaults. Carbon Compass highlights the next habit with the clearest impact for your own data.</p>
        <ul className="milestones-list" aria-label="Milestones">
          {dashboard.progress.milestones.map((milestone) => (
            <li key={milestone.code} className="milestone-badge">{milestone.title}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState() {
  return <div className="empty-state">Log your first day to see a trend.</div>;
}
