export const C = {
  bg:          '#321A00',
  surface:     '#2a1500',
  surfaceAlt:  '#3d2000',
  card:        'rgba(255,200,120,0.06)',
  border:      'rgba(255,200,120,0.12)',
  borderHover: 'rgba(255,131,0,0.35)',
  green:       '#FF8300',
  greenDim:    'rgba(255,131,0,0.12)',
  greenDark:   '#cc6600',
  text:        '#FFF5EB',
  muted:       'rgba(255,245,235,0.45)',
  mutedDark:   'rgba(255,245,235,0.28)',
  orange:      '#FF8300',
  red:         '#ef4444',
  blue:        '#3b82f6',
  yellow:      '#f59e0b',
}

export const bgMesh = {
  background: C.bg,
  backgroundImage: `
    radial-gradient(ellipse 70% 50% at 20% 0%,rgba(255,131,0,0.12) 0%,transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 20%,rgba(255,131,0,0.06) 0%,transparent 50%)
  `,
  color: C.text,
  minHeight: '100vh',
}

export const navStyle = {
  borderBottom: `1px solid ${C.border}`,
  background: 'rgba(50,26,0,0.92)',
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
  color: '#1a0d00',
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
  background: 'rgba(255,200,120,0.08)',
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
