export const inputStyle = {
  border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "9px 12px",
  fontSize: 14, color: "#1E293B", background: "#fff", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase",
};

export const fieldGroup = { display: "flex", flexDirection: "column", gap: 5 };

export const btnPrincipal = {
  background: "linear-gradient(135deg,#1A3A5C,#2E7DC4)", color: "#fff",
  border: "none", borderRadius: 10, padding: "12px", fontWeight: 700,
  cursor: "pointer", fontSize: 14, fontFamily: "inherit",
};

export const btnSecundario = {
  background: "#F1F5F9", color: "#475569", border: "1.5px solid #E2E8F0",
  borderRadius: 10, padding: "10px 14px", fontWeight: 600, cursor: "pointer",
  fontSize: 14, fontFamily: "inherit",
};

export const overlay = {
  position: "fixed", inset: 0, background: "rgba(15,37,64,0.75)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 16,
};

export const modal = {
  background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column",
};
