import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../client/src/App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/auth/me") {
          return { ok: false, json: async () => ({ error: "Unauthenticated" }) };
        }
        if (url === "/api/csrf") {
          return { ok: true, json: async () => ({ csrfToken: "test-token" }) };
        }
        return {
          ok: true,
          json: async () => ({
            user: { id: 1, name: "Asha", email: "asha@example.com" },
            entries: [],
            actions: [],
            progress: { entriesCount: 0, actionsCount: 0, averageKg: 0, latestKg: 0, savedKg: 0, milestones: [] },
            recommendations: []
          })
        };
      })
    );
  });

  it("renders the authentication screen", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Carbon Compass" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("switches to login mode", async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole("tab", { name: "Log in" }));
    const tabs = screen.getByRole("tablist", { name: "Authentication mode" });
    expect(within(tabs).getByRole("tab", { name: "Log in" })).toHaveClass("active");
  });

  it("renders the dashboard when authenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/csrf") {
          return { ok: true, json: async () => ({ csrfToken: "test-token" }) };
        }
        if (url === "/api/auth/me") {
          return { ok: true, json: async () => ({ user: { id: 1, name: "Asha", email: "asha@example.com" } }) };
        }
        return {
          ok: true,
          json: async () => ({
            entries: [
              {
                id: 1,
                entryDate: "2026-06-21",
                transportKm: 10,
                transportMode: "car",
                electricityKwh: 4,
                gasKwh: 1,
                dietType: "vegetarian",
                meals: 3,
                purchasesAmount: 5,
                totalKg: 12.5
              }
            ],
            actions: [],
            progress: { entriesCount: 1, actionsCount: 0, averageKg: 12.5, latestKg: 12.5, savedKg: 0, milestones: [] },
            recommendations: [
              {
                id: "steady-progress",
                title: "Protect your low-impact habits",
                detail: "Your latest entry is balanced. Pick one habit to repeat three times this week.",
                impactKg: 0.8,
                category: "Progress"
              }
            ]
          })
        };
      })
    );

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Carbon Compass" })).toBeInTheDocument();
    expect(screen.getByText("Asha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByText("Daily calculator")).toBeInTheDocument();
    expect(screen.getByText("Personalized insights")).toBeInTheDocument();
    expect(screen.getByText("Protect your low-impact habits")).toBeInTheDocument();
  });
});
