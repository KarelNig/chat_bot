import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRandomResponse, getRandomDelay, sleep } from "@/lib/ai-bot";

const KNOWN_RESPONSES = [
  "That is a great point! I completely agree with your perspective.",
  "Interesting! Could you tell me a bit more about that?",
  "I see what you mean. Here is how I would approach this situation.",
  "Thanks for sharing — that gives me a lot to think about.",
  "Absolutely! I was just thinking the same thing.",
  "I understand. Let me help you work through this.",
  "Good question! The answer really depends on a few factors.",
  "That makes total sense. Have you considered the alternative?",
  "I appreciate your patience — let me gather my thoughts on this.",
  "Fascinating! I had not thought of it from that angle before.",
  "You raise an excellent point. Here is my take on it.",
  "Let me think about that for a moment... Yes, I agree completely.",
];

describe("getRandomResponse", () => {
  it("returns a non-empty string", () => {
    expect(typeof getRandomResponse()).toBe("string");
    expect(getRandomResponse().length).toBeGreaterThan(0);
  });

  it("returns only strings from the response pool", () => {
    for (let i = 0; i < 50; i++) {
      expect(KNOWN_RESPONSES).toContain(getRandomResponse());
    }
  });

  it("returns varied responses across multiple calls", () => {
    const results = new Set(Array.from({ length: 60 }, () => getRandomResponse()));
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("getRandomDelay", () => {
  it("returns a number between 1000 and 5000 ms", () => {
    for (let i = 0; i < 30; i++) {
      const delay = getRandomDelay();
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(5000);
    }
  });

  it("returns an integer", () => {
    for (let i = 0; i < 20; i++) {
      expect(Number.isInteger(getRandomDelay())).toBe(true);
    }
  });
});

describe("sleep", () => {
  it("returns a Promise", () => {
    const result = sleep(0);
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  describe("with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("resolves after the specified delay", async () => {
      let resolved = false;
      const promise = sleep(1000).then(() => {
        resolved = true;
      });
      expect(resolved).toBe(false);
      await vi.advanceTimersByTimeAsync(1000);
      await promise;
      expect(resolved).toBe(true);
    });

    it("does not resolve before the delay elapses", async () => {
      let resolved = false;
      void sleep(2000).then(() => {
        resolved = true;
      });
      await vi.advanceTimersByTimeAsync(999);
      expect(resolved).toBe(false);
      await vi.advanceTimersByTimeAsync(1001);
      expect(resolved).toBe(true);
    });
  });
});
