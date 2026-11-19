/**
 * Helper untuk mengekstrak inisial nama siswa (1-2 huruf kapital).
 * Contoh:
 * - "eimas" -> "EI"
 * - "Eimas" -> "EI"
 * - "Eimas Pratama" -> "EP"
 * - "Aris Pratama" -> "AP"
 * - "B" -> "B"
 * - Kosong / undefined -> "ST" (Siswa Tamu)
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'ST';
  const clean = name.trim();
  if (!clean) return 'ST';

  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];

  if (!first) return 'ST';

  if (parts.length === 1 || !second) {
    return (first.length >= 2 ? first.slice(0, 2) : first).toUpperCase();
  }

  const firstChar = first.charAt(0);
  const secondChar = second.charAt(0);
  return (firstChar + secondChar).toUpperCase();
}
