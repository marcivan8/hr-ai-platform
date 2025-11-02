export function safeJsonParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}