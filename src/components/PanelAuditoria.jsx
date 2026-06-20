import { useState } from "react";
import { formatFecha } from "../constants.js";
import { overlay, modal, inputStyle } from "../styles.js";

const COLORES = {
  login: "#2E7DC4",
  logout: "#64748B",
  carga: "#059669",
  edicion: "#C8993A",
  eliminacion: "#DC2626",
  export: "#7C3AED",
};

export default function PanelAuditoria({ logs, onClose }) {
  const [filtro, setFiltro] = useState("");
  const filtrados = logs
    .filter(
      (l) =>
        l.usuario?.toLowerCase().includes(filtro.toLowerCase()) ||
        l.tipo?.toLowerCase().includes(filtro.toLowerCase()) ||
        l.detalle?.toLowerCase().includes(filtro.toLowerCase())
    )
    .slice()
    .reverse();

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 640, maxHeight: "90vh" }}>
        <div style={{ background: "linear-gradient(135deg,#0F2540,#1A3A5C)", borderRadius: "14px 14px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#C8993A", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>ADMINISTRACIÓN</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>🔍 Registro de Auditoría</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
          <input type="text" placeholder="🔍 Buscar por usuario, acción o detalle..." value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
        </div>
        <div style={{ overflowY: "auto", flex: 1, maxHeight: 480 }}>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>Sin registros</div>
          ) : (
            filtrados.map((log, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 20px", borderBottom: "1px solid #F1F5F9", alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORES[log.tipo] || "#94A3B8", marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{log.usuario}</span>
                    <span style={{ background: (COLORES[log.tipo] || "#94A3B8") + "22", color: COLORES[log.tipo] || "#94A3B8", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>
                      {log.tipo}
                    </span>
                    {log.rol && <span style={{ color: "#94A3B8", fontSize: 11 }}>({log.rol})</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", marginTop: 3 }}>{log.detalle}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{formatFecha(log.fecha)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ color: "#94A3B8", fontSize: 12 }}>Total: {logs.length} eventos registrados</div>
        </div>
      </div>
    </div>
  );
}
