export function parseAmazonDate(dateStr) {
  // Input: 2025-12-30T07:10:51+00:00
  // Output: { iso: '2025-12-30', display: '30-12-2025' }

  if (!dateStr) return null;

  const iso = dateStr.split("T")[0];
  const [yyyy, mm, dd] = iso.split("-");

  return {
    iso,
    display: `${dd}-${mm}-${yyyy}`
  };
}

export function isWithinLastNDays(isoDate, days = 30) {
  const today = new Date();
  const target = new Date(isoDate);

  const diffMs = today - target;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= days;
}
