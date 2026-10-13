import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockCalendar, isMockScenario, MOCK_SCENARIOS } from "@/lib/calendar/mock";
import { copyText } from "@/lib/clipboard";
import { disconnectGoogle, fetchConnectionStatus, savePending, takePending } from "@/lib/session-client";
import { dayRange } from "@/lib/time";
import { clientIp, consume, resetRateLimits } from "@/server/rate-limit";

afterEach(() => {
  vi.unstubAllGlobals();
});

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("copyText", () => {
  it("Clipboard API でコピー", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyText("hello")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("Clipboard API が失敗したら従来方式で試し、それも失敗なら false", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    const textarea = { value: "", setAttribute: vi.fn(), className: "", select: vi.fn(), remove: vi.fn() };
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal("document", {
      createElement: () => textarea,
      body: { appendChild: vi.fn() },
      execCommand,
    });
    expect(await copyText("x")).toBe(true);
    expect(textarea.value).toBe("x");
    execCommand.mockReturnValue(false);
    expect(await copyText("x")).toBe(false);
    vi.stubGlobal("document", undefined);
    expect(await copyText("x")).toBe(false);
  });
});

describe("session-client", () => {
  it("連携状態の取得と失敗時の扱い", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ configured: true, connected: true }))),
    );
    expect(await fetchConnectionStatus()).toEqual({ configured: true, connected: true });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchConnectionStatus()).toEqual({ configured: false, connected: false });
  });

  it("連携解除は独自ヘッダー付きの POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await disconnectGoogle()).toBe(true);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", headers: { "X-KYRE-Request": "1" } });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await disconnectGoogle()).toBe(false);
  });

  it("一時保存は本文や要確認を含まず、1 回読むと消える", () => {
    const storage = memoryStorage();
    vi.stubGlobal("sessionStorage", storage);
    savePending({
      referenceDate: "2026-10-13",
      candidates: [{ id: "c1", date: "2026-10-20", startTime: "19:00", ambiguities: [{ kind: "ampm", message: "x" }] }],
      settings: {
        durationMinutes: 90,
        bufferMinutes: 15,
        activeHours: { startHour: 0, endHour: 24 },
        timeZone: "Asia/Tokyo",
      },
    });
    const raw = storage.getItem("kyre:pending")!;
    expect(raw).not.toContain("ambiguities");
    expect(takePending()?.candidates).toHaveLength(1);
    expect(takePending()).toBeNull();
  });

  it("sessionStorage が使えない環境でもエラーにしない", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    });
    expect(() => savePending({ referenceDate: "2026-10-13", candidates: [], settings: {} as never })).not.toThrow();
    expect(takePending()).toBeNull();
  });
});

describe("ダミーカレンダーの全シナリオ", () => {
  const range = dayRange("2026-10-20", "Asia/Tokyo");
  it.each(MOCK_SCENARIOS)("%s", async (scenario) => {
    const res = await createMockCalendar({ scenario, timeZone: "Asia/Tokyo", delayMs: 1 }).fetchBusy([range]);
    if (scenario === "error") expect(res.status).toBe("error");
    else expect(res.status).toBe("ok");
  });

  it("isMockScenario", () => {
    expect(isMockScenario("mixed")).toBe(true);
    expect(isMockScenario("<script>")).toBe(false);
  });
});

describe("rate-limit", () => {
  it("接続元 IP の判定", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("時間枠が過ぎると再び許可", () => {
    resetRateLimits();
    const rule = { limit: 1, windowMs: 1000 };
    expect(consume("k", rule, 0)).toBe(true);
    expect(consume("k", rule, 10)).toBe(false);
    expect(consume("k", rule, 1001)).toBe(true);
  });

  it("大量のキーでもメモリを使い切らない", () => {
    resetRateLimits();
    for (let i = 0; i < 10_050; i++) consume(`k${i}`, { limit: 1, windowMs: 1 }, 0);
    expect(consume("new", { limit: 1, windowMs: 1 }, 100)).toBe(true);
  });
});
