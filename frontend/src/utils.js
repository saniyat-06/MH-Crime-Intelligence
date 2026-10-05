// Maharashtra Geographic Coordinates and Visual Helpers

export const MAHARASHTRA_CENTER = [19.2, 75.8];
export const MAHARASHTRA_BOUNDS = [
  [15.4, 72.4],
  [22.3, 81.1],
];

// Color scale for choropleth-style station density circles (Muted charcoal-to-crimson/saffron)
const COLORS = ["#fcd34d", "#fb923c", "#f97316", "#ef4444", "#b91c1c"];

export function densityColor(count, min, max) {
  if (max === min || max === undefined || min === undefined) return COLORS[2];
  const ratio = Math.max(0, Math.min(1, (count - min) / (max - min || 1)));
  const idx = Math.min(COLORS.length - 1, Math.floor(ratio * COLORS.length));
  return COLORS[idx];
}

export function densityRadius(count, min, max) {
  if (max === min || max === undefined || min === undefined) return 12;
  const ratio = Math.max(0, Math.min(1, (count - min) / (max - min || 1)));
  return 9 + ratio * 20; // 9px to 29px
}

export function boundsForStations(stations) {
  if (!stations || stations.length === 0) return null;
  const lats = stations.map((s) => s.lat).filter(Boolean);
  const longs = stations.map((s) => s.long).filter(Boolean);
  if (lats.length === 0 || longs.length === 0) return null;
  return [
    [Math.min(...lats) - 0.08, Math.min(...longs) - 0.08],
    [Math.max(...lats) + 0.08, Math.max(...longs) + 0.08],
  ];
}

export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}
