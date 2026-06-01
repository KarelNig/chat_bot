const RESPONSES: readonly string[] = [
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

/** Random AI response from the pool */
export function getRandomResponse(): string {
  return RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
}

/** Random delay in ms, uniformly distributed between 1 s and 5 s */
export function getRandomDelay(): number {
  return Math.floor(Math.random() * 4000) + 1000;
}

/** Awaitable sleep */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
