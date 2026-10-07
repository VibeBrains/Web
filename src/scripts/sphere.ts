import { motionAllowed } from '@vibebrains/site-kit/scripts/motion'

/** Points of the network sphere and how close two must be to be linked */
const POINTS = 150
const LINK_DISTANCE = 0.42

/** Radius of the point sphere and of the orbit the provider names ride on, as a share of half the canvas */
const SPHERE_RADIUS = 0.62
const ORBIT_RADIUS = 0.86

/** Turn per second around the vertical and the tilt of the axis, in radians */
const SPIN = 0.22
const AXIS_TILT = 0.38

/** Distance of the eye from the centre in sphere radii: smaller is a stronger perspective */
const EYE = 3.2

const TEAL = [63, 199, 194] as const
const MAGENTA = [177, 60, 192] as const

type Vec = [number, number, number]

/** Evenly spread points on a unit sphere (Fibonacci lattice) */
const lattice = (count: number): Vec[] => {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const a = golden * i
    return [Math.cos(a) * r, y, Math.sin(a) * r]
  })
}

const rotate = ([x, y, z]: Vec, angle: number): Vec => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rx = x * cos + z * sin
  const rz = -x * sin + z * cos
  const tc = Math.cos(AXIS_TILT)
  const ts = Math.sin(AXIS_TILT)
  return [rx, y * tc - rz * ts, y * ts + rz * tc]
}

const mix = (t: number): string => {
  const c = TEAL.map((v, i) => Math.round(v + ((MAGENTA[i] ?? v) - v) * t))
  return `${c[0]}, ${c[1]}, ${c[2]}`
}

/**
 * The models sphere: a rotating 3D network of points with the provider names orbiting it
 * Drawn on a canvas, the names are real elements moved by transform, nearer ones larger and brighter
 * It turns only while on screen; with reduced motion it draws one still frame
 */
export const initSphere = (): void => {
  document.querySelectorAll<HTMLElement>('[data-sphere]').forEach((root) => {
    const canvas = root.querySelector('canvas')
    const context = canvas?.getContext('2d')
    const labels = [...root.querySelectorAll<HTMLElement>('.orbit-item')]
    if (canvas === null || canvas === undefined || context === null || context === undefined) return

    const points = lattice(POINTS)
    const links: [number, number][] = []
    points.forEach((a, i) => {
      points.forEach((b, j) => {
        if (j <= i) return
        if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < LINK_DISTANCE) links.push([i, j])
      })
    })
    const orbit = lattice(labels.length)
    let size = 0
    let ratio = 1

    const resize = (): void => {
      ratio = Math.min(window.devicePixelRatio || 1, 2)
      size = root.clientWidth
      canvas.width = size * ratio
      canvas.height = size * ratio
    }

    const project = (v: Vec, radius: number): { x: number; y: number; scale: number; depth: number } => {
      const scale = EYE / (EYE - v[2])
      return { x: size / 2 + v[0] * radius * scale, y: size / 2 + v[1] * radius * scale, scale, depth: (v[2] + 1) / 2 }
    }

    const draw = (angle: number): void => {
      const half = size / 2
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, size, size)
      const placed = points.map((p) => project(rotate(p, angle), half * SPHERE_RADIUS))
      const tones = points.map((p) => (rotate(p, angle)[0] + 1) / 2)

      context.lineWidth = 1
      for (const [i, j] of links) {
        const a = placed[i]
        const b = placed[j]
        if (a === undefined || b === undefined) continue
        const alpha = 0.04 + ((a.depth + b.depth) / 2) * 0.22
        context.strokeStyle = `rgba(${mix(tones[i] ?? 0)}, ${alpha})`
        context.beginPath()
        context.moveTo(a.x, a.y)
        context.lineTo(b.x, b.y)
        context.stroke()
      }
      placed.forEach((p, i) => {
        context.fillStyle = `rgba(${mix(tones[i] ?? 0)}, ${0.25 + p.depth * 0.75})`
        context.beginPath()
        context.arc(p.x, p.y, 1.2 + p.depth * 2.2, 0, Math.PI * 2)
        context.fill()
      })

      labels.forEach((label, i) => {
        const at = orbit[i]
        if (at === undefined) return
        const p = project(rotate(at, -angle * 0.6), half * ORBIT_RADIUS)
        const scale = 0.62 + p.depth * 0.5
        label.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${scale})`
        label.style.opacity = String(0.18 + p.depth * 0.82)
        label.style.zIndex = String(Math.round(p.depth * 100))
      })
    }

    resize()
    root.classList.add('is-ready')
    draw(0.6)
    new ResizeObserver(() => {
      resize()
      draw(0.6)
    }).observe(root)

    if (!motionAllowed()) return

    let frame = 0
    let started = 0
    const tick = (now: number): void => {
      if (started === 0) started = now
      draw(0.6 + ((now - started) / 1000) * SPIN)
      frame = requestAnimationFrame(tick)
    }
    root.addEventListener('playchange', (event) => {
      cancelAnimationFrame(frame)
      if ((event as CustomEvent<boolean>).detail) frame = requestAnimationFrame(tick)
    })
  })
}
