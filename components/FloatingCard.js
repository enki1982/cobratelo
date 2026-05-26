import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SPRING_CONFIG = { stiffness: 180, damping: 22, mass: 0.4 }
const GLOW_SPRING = { stiffness: 120, damping: 20 }

export function FloatingCard({
  children, style, depth = 1,
  glowColor = 'rgba(255,131,0,0.2)',
  className = ''
}) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Rotación suave con spring
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [7, -7]), SPRING_CONFIG)
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-9, 9]), SPRING_CONFIG)

  // Scale y elevación
  const scale = useMotionValue(1)
  const scaleSpr = useSpring(scale, SPRING_CONFIG)
  const glowOpacity = useMotionValue(0)
  const glowSpr = useSpring(glowOpacity, GLOW_SPRING)

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseEnter = () => {
    scale.set(1.025)
    glowOpacity.set(1)
    setHovered(true)
  }

  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
    scale.set(1)
    glowOpacity.set(0)
    setHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        rotateX,
        rotateY,
        scale: scaleSpr,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
        willChange: 'transform',
        position: style?.position || 'relative',
      }}
      className={className}
    >
      {/* Glow difuminado */}
      <motion.div style={{
        position: 'absolute',
        inset: -8,
        borderRadius: 'inherit',
        background: glowColor,
        filter: 'blur(20px)',
        opacity: glowSpr,
        pointerEvents: 'none',
        zIndex: -1,
      }} />
      {children}
    </motion.div>
  )
}

export function FloatingScene({ children, style, className = '' }) {
  return (
    <div
      style={{ perspective: '1200px', perspectiveOrigin: '50% 40%', ...style }}
      className={className}
    >
      {children}
    </div>
  )
}
