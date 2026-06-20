export function StockBadge({ cantidad }) {
  const color =
    cantidad <= 0
      ? { bg: "#FEE2E2", text: "#DC2626" }
      : cantidad <= 10
      ? { bg: "#FEF3C7", text: "#D97706" }
      : { bg: "#D1FAE5", text: "#059669" };
  return (
    <span style={{ background: color.bg, color: color.text, fontWeight: 700, fontSize: 12, padding: "2px 10px", borderRadius: 20 }}>
      {cantidad <= 0 ? "Sin stock" : cantidad}
    </span>
  );
}

export function InfoItem({ label, value }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "#1E293B", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{value || "—"}</div>
    </div>
  );
}
