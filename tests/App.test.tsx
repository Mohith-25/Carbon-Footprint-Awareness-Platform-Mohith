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
    await userEvent.click(await screen.findByRole("button", { name: "Log in" }));
    const tabs = screen.getByRole("tablist", { name: "Authentication mode" });
    expect(within(tabs).getByRole("button", { name: "Log in" })).toHaveClass("active");
  });
});
