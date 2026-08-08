import React from 'react';
import { LayoutDashboard, Package, History, Settings, Users, ShieldCheck, LogOut, FileSearch } from 'lucide-react';
import logo from "../assets/logo.png";

const NavItem = ({ icon, label, activo, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '10px 16px',
      borderRadius: 8,
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      background: activo ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      color: activo ? '#FFFFFF' : (disabled ? '#6B7280' : '#D1D5DB'),
      fontSize: 14,
      fontWeight: activo ? 700 : 500,
      transition: 'background 0.2s ease, color 0.2s ease',
    }}
    disabled={disabled}
  >
    {icon}
    {label}
  </button>
);

export default function Sidebar({ usuarioActual, paginaActiva, setPaginaActiva, onLogout, onOpenUsuarios, onOpenAuditoria }) {
  const esAdmin = usuarioActual.rol === "Administrador";

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, adminOnly: true },
    { id: 'stock', label: 'Inventario Total', icon: <Package size={20} /> },
    { id: 'historial', label: 'Historial', icon: <History size={20} /> },
    { id: 'expedientes', label: 'Consulta Expedientes', icon: <FileSearch size={20} /> },
    { id: 'configuracion', label: 'Mi Perfil', icon: <Settings size={20} /> },
  ];

  return (
    <aside style={{ background: '#111827', color: '#F9FAFB', padding: '20px 14px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1F2937' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 20px' }}>
        <img src={logo} alt="Logo" style={{ width: 32, height: 32 }} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>SGI Desarrollo Humano</div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {navItems.map(item => {
          if (item.adminOnly && !esAdmin) return null;
          return (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              activo={paginaActiva === item.id}
              onClick={() => setPaginaActiva(item.id)}
              disabled={item.disabled}
            />
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid #374151', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ padding: '0 16px 10px', fontSize: 12, color: '#9CA3AD' }}>
          Hola, <strong>{usuarioActual.nombre}</strong>
        </div>
        {esAdmin && (
          <>
            <NavItem icon={<Users size={20} />} label="Gestionar Usuarios" onClick={onOpenUsuarios} />
            <NavItem icon={<ShieldCheck size={20} />} label="Auditoría" onClick={onOpenAuditoria} />
          </>
        )}
        <NavItem icon={<LogOut size={20} />} label="Cerrar Sesión" onClick={onLogout} />
      </div>
    </aside>
  );
}