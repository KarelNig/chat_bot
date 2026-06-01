export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDate(date: Date): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return "Today";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function generateId(): string {
  return `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getLastMessage(messages: { text: string }[]): string {
  return messages.at(-1)?.text ?? "No messages yet";
}
