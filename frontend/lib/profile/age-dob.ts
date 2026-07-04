/** Approximate ISO date (yyyy-mm-dd) from a whole-number age for API `dateOfBirth`. */
export function approximateDobFromAge(ageStr: string): string | undefined {
  const n = Number.parseInt(ageStr.trim(), 10);
  if (!Number.isFinite(n) || n < 3 || n > 120) return undefined;
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCFullYear(d.getUTCFullYear() - n);
  return d.toISOString().slice(0, 10);
}

/** Display age from an ISO date string (client-side approximation). */
export function displayAgeFromIsoDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return "";
  const diff = Date.now() - birth.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age > 0 ? String(age) : "";
}
