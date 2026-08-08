import React, { useState } from 'react';
import { inputStyle, labelStyle, fieldGroup, btnPrincipal, btnSecundario } from "../styles.js";
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function PaginaConfiguracion({ usuarioActual, onUpdateUsuario, onAudit }) {
  const [nombre, setNombre] = useState(usuarioActual.nombre);
  const [errorNombre, setErrorNombre] = useState('');
  const [exitoNombre, setExitoNombre] = useState('');

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [errorPass, setErrorPass] = useState('');
  const [exitoPass, setExitoPass] = useState('');
  const [verPassActual, setVerPassActual] = useState(false);
  const [verPassNueva, setVerPassNueva] = useState(false);
  const [verPassConfirm, setVerPassConfirm] = useState(false);

  const handleGuardarNombre = () => {
    setErrorNombre('');
    setExitoNombre('');
    if (!nombre.trim()) {
      setErrorNombre('El nombre no puede estar vacío.');
      return;
    }

    const usuarioActualizado = { ...usuarioActual, nombre: nombre.trim() };
    onUpdateUsuario(usuarioActualizado);
    onAudit({ tipo: 'seguridad', detalle: `Cambió su nombre a '${nombre.trim()}'` });
    setExitoNombre('Nombre actualizado correctamente.');
    setTimeout(() => setExitoNombre(''), 3000);
  };

  const handleCambiarPass = () => {
    setErrorPass('');
    setExitoPass('');

    if (!passActual || !passNueva || !passConfirm) {
      setErrorPass('Todos los campos son obligatorios.');
      return;
    }
    if (passActual !== usuarioActual.password) {
      setErrorPass('La contraseña actual es incorrecta.');
      return;
    }
    if (passNueva.length < 6) {
      setErrorPass('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passNueva !== passConfirm) {
      setErrorPass('Las nuevas contraseñas no coinciden.');
      return;
    }
    if (passNueva === passActual) {
      setErrorPass('La nueva contraseña no puede ser igual a la actual.');
      return;
    }

    const usuarioActualizado = { ...usuarioActual, password: passNueva };
    onUpdateUsuario(usuarioActualizado);
    onAudit({ tipo: 'seguridad', detalle: 'Cambió su contraseña.' });
    setExitoPass('Contraseña cambiada con éxito.');
    setPassActual('');
    setPassNueva('');
    setPassConfirm('');
    setTimeout(() => setExitoPass(''), 3000);
  };

  const renderInputPassword = (value, setter, visible, toggle) => (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => setter(e.target.value)}
        style={{ ...inputStyle, paddingRight: 40 }}
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={toggle}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 24 }}>Mi Perfil</h1>

      {/* Cambiar Nombre */}
      <div style={{ background: '#fff', borderRadius: 12, border: "1px solid #E5E7EB", overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} color="#4B5563" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Cambiar Nombre</h2>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
              placeholder="Tu nombre visible en el sistema"
            />
          </div>
          {errorNombre && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {errorNombre}</div>}
          {exitoNombre && <div style={{ color: "#047857", background: "#D1FAE5", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>✅ {exitoNombre}</div>}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleGuardarNombre} style={{ ...btnPrincipal, padding: '10px 20px' }}>Guardar Nombre</button>
        </div>
      </div>

      {/* Cambiar Contraseña */}
      <div style={{ background: '#fff', borderRadius: 12, border: "1px solid #E5E7EB", overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} color="#4B5563" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Cambiar Contraseña</h2>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Contraseña Actual</label>
            {renderInputPassword(passActual, setPassActual, verPassActual, () => setVerPassActual(v => !v))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Nueva Contraseña</label>
              {renderInputPassword(passNueva, setPassNueva, verPassNueva, () => setVerPassNueva(v => !v))}
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>Confirmar Nueva Contraseña</label>
              {renderInputPassword(passConfirm, setPassConfirm, verPassConfirm, () => setVerPassConfirm(v => !v))}
            </div>
          </div>
          {errorPass && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {errorPass}</div>}
          {exitoPass && <div style={{ color: "#047857", background: "#D1FAE5", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>✅ {exitoPass}</div>}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleCambiarPass} style={{ ...btnPrincipal, padding: '10px 20px' }}>Cambiar Contraseña</button>
        </div>
      </div>
    </div>
  );
}