import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SPRING = { stiffness: 150, damping: 20, mass: 0.5 }

export function FloatingCard({ children, style, depth = 1, glowColor = 'rgba(0,232,122,0.15)', className = '' }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), SPRING)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), SPRING)
  const scale = useSpring(hovered ? 1.02 : 1, SPRING)
  const translateZ = useSpring(hovered ? depth * 12 : 0, SPRING)
  const glowOpacity = useSpring(hovered ? 1 : 0, { stiffness: 120, damping: 18 })

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    x.set(px)
    y.set(py)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        rotateX,
        rotateY,
        scale,
        translateZ,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
        position: 'relative',
        willChange: 'transform',
      }}
      className={className}
    >
      {/* Glow */}
      <motion.div style={{
        position: 'absolute', inset: -1, borderRadius: 'inherit',
        background: glowColor,
        filter: 'blur(16px)',
        opacity: glowOpacity,
        pointerEvents: 'none',
        zIndex: -1,
      }} />
      {children}
    </motion.div>
  )
}

export function FloatingScene({ children, style }) {
  return (
    <div style={{ perspective: '1200px', perspectiveOrigin: '50% 40%', ...style }}>
      {children}
    </div>
  )
}
