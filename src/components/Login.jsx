import { useState } from "react";
import { inputStyle, labelStyle, fieldGroup, btnPrincipal } from "../styles.js";
import { firebaseConfigurado } from "../firebase.js";
import logo from "../assets/logo.png";

export default function Login({ usuarios, onLogin, onAudit }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [verPass, setVerPass] = useState(false);

  const handleLogin = () => {
    const userInput = user.trim().toLowerCase();
    const found = usuarios.find((u) => String(u.usuario).toLowerCase() === userInput && u.password === pass);
    if (!found) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    onAudit({ tipo: "login", usuario: found.nombre, rol: found.rol, detalle: "Inicio de sesión exitoso" });
    onLogin(found);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F2540 0%,#1A3A5C 50%,#2E7DC4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={logo}
            alt="Logo del Ministerio de Desarrollo Humano"
            style={{ width: 80, height: 80, objectFit: "contain", margin: "0 auto 14px", display: "block", filter: "drop-shadow(0 4px 12px rgba(46,125,196,0.3))" }}
          />
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1A3A5C" }}>Ministerio de Desarrollo Humano</div>
          <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>Sistema de Control de Inventario</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Usuario</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Ingresá tu usuario"
              style={inputStyle}
            />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={verPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button
                onClick={() => setVerPass((v) => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94A3B8" }}
              >
                {verPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {error && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
          <button onClick={handleLogin} style={{ ...btnPrincipal, marginTop: 4, padding: "13px" }}>
            Ingresar al Sistema
          </button>
        </div>

        <div style={{ marginTop: 24, padding: "12px", background: "#F8FAFC", borderRadius: 10, fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
          Todos los accesos y movimientos quedan registrados
        </div>
      </div>
    </div>
  );
}
