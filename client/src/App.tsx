import { FormEvent, useCallback, useEffect, useState } from "react";
import { Leaf, LogOut } from "lucide-react";
import { apiFetch, DashboardData, User } from "./api";
import { Dashboard } from "./components/Dashboard";

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
