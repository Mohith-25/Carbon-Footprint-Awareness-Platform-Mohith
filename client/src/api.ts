export interface User {
  id: number;
  name: string;
  email: string;
}

export interface FootprintEntry {
  id: number;
  entryDate: string;
  transportKm: number;
  transportMode: string;
  electricityKwh: number;
  gasKwh: number;
  dietType: string;
  meals: number;
  purchasesAmount: number;
  totalKg: number;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  impactKg: number;
  category: string;
}

export interface EcoAction {
  id: number;
  actionDate: string;
  category: string;
  description: string;
  estimatedSavingsKg: number;
}

export interface Progress {
  entriesCount: number;
  actionsCount: number;
  averageKg: number;
  latestKg: number;
  savedKg: number;
  milestones: Array<{ code: string; title: string; achievedAt: string }>;
}

export interface DashboardData {
  entries: FootprintEntry[];
  actions: EcoAction[];
  progress: Progress;
  recommendations: Recommendation[];
}

let csrfToken = "";

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch("/api/csrf", { credentials: "include" });
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  if (method !== "GET" && method !== "HEAD") {
    headers.set("Content-Type", "application/json");
    headers.set("x-csrf-token", await ensureCsrf());
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}
