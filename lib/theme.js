export const C = {
  bg: '#0d1117',
  surface: '#161b27',
  surfaceAlt: '#1a2030',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(0,232,122,0.3)',
  green: '#00e87a',
  greenDim: 'rgba(0,232,122,0.10)',
  greenDark: '#00c466',
  text: '#f0f0f5',
  muted: 'rgba(240,240,245,0.5)',
  mutedDark: 'rgba(240,240,245,0.3)',
  orange: '#E8540A',
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#f59e0b',
}

export const bgMesh = {
  background: C.bg,
  backgroundImage: `
    radial-gradient(ellipse 80% 60% at 20% 0%,rgba(0,232,122,0.06) 0%,transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 20%,rgba(124,58,237,0.08) 0%,transparent 50%),
    radial-gradient(ellipse 50% 40% at 50% 80%,rgba(37,99,235,0.06) 0%,transparent 50%)
  `,
  color: C.text,
  minHeight: '100vh',
}

export const navStyle = {
  borderBottom: `1px solid ${C.border}`,
  background: 'rgba(9,9,15,0.88)',
  backdropFilter: 'blur(12px)',
  position: 'sticky',
  top: 0,
  zIndex: 50,
  padding: '0 24px',
}

export const cardStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 20,
}

export const btnPrimary = {
  background: C.green,
  color: '#000',
  fontWeight: 700,
  fontSize: 15,
  padding: '13px 28px',
  borderRadius: 100,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
}

export const btnSecondary = {
  background: 'rgba(255,255,255,0.06)',
  color: C.text,
  fontWeight: 600,
  fontSize: 14,
  padding: '12px 24px',
  borderRadius: 100,
  border: `1px solid ${C.border}`,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
}

export const inputStyle = {
  background: C.surface,
  border: `2px solid ${C.border}`,
  borderRadius: 14,
  padding: '14px 18px',
  color: C.text,
  fontSize: 15,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
}

export const sectionDivider = { borderTop: `1px solid ${C.border}` }
