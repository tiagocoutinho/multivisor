import { afterEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api";

describe("API 封装", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("processAction 返回 Response 并保持原有请求格式", async () => {
    const response = { ok: true, status: 200 };
    const fetch = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetch);

    const returned = api.processAction("n:g:worker", "restart");

    expect(returned).toBeInstanceOf(Promise);
    expect(fetch).toHaveBeenCalledWith("/api/process/restart", {
      method: "POST",
      body: expect.any(FormData),
    });
    const form = fetch.mock.calls[0][1].body;
    expect(form.get("uid")).toBe("n:g:worker");
    await expect(returned).resolves.toBe(response);
  });

  it("supervisorAction 保持原有请求格式", async () => {
    const response = { ok: true, status: 200 };
    const fetch = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetch);

    const returned = api.supervisorAction("node", "update");

    expect(returned).toBeInstanceOf(Promise);
    expect(fetch).toHaveBeenCalledWith("/api/supervisor/update", {
      method: "POST",
      body: expect.any(FormData),
    });
    expect(fetch.mock.calls[0][1].body.get("supervisor")).toBe("node");
    await expect(returned).resolves.toBe(response);
  });
});
