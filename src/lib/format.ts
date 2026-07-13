export const fmtDate = (d?: string | Date | null) => {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtTime = (d?: string | Date | null) => {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};
export const fmtDateTime = (d?: string | Date | null) => (d ? `${fmtDate(d)} · ${fmtTime(d)}` : "-");
export const dayName = (n: number) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][n] ?? "-";
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const generateMRN = () => {
  const y = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MRN-${y}${rand}`;
};
