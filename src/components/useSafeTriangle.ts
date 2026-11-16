import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'

type Point = { x: number; y: number }

export type SafeTriangleGeometry = {
  origin: Point
  top: Point
  bottom: Point
}

function isInTriangle(point: Point, a: Point, b: Point, c: Point) {
  const cross = (p: Point, q: Point, r: Point) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  if (cross(a, b, c) === 0) return false
  const sides = [cross(a, b, point), cross(b, c, point), cross(c, a, point)]
  return sides.every((side) => side >= 0) || sides.every((side) => side <= 0)
}

type SafeTriangleOptions = {
  activeId: string | null
  onEnter: (id: string) => void
  onLeave: (id: string) => void
}

export function useSafeTriangle({ activeId, onEnter, onLeave }: SafeTriangleOptions) {
  const [triangle, setTriangle] = useState<SafeTriangleGeometry | null>(null)
  const trackingRef = useRef<{
    id: string
    pendingId: string | null
    stop: () => void
  } | null>(null)

  const cancel = useCallback(() => {
    trackingRef.current?.stop()
    trackingRef.current = null
    setTriangle(null)
  }, [])

  useEffect(() => cancel, [activeId, cancel])

  function handleMouseEnter(id: string) {
    const tracking = trackingRef.current
    if (tracking && tracking.id !== id) {
      tracking.pendingId = id
      return
    }
    cancel()
    onEnter(id)
  }

  function handleMouseLeave(event: MouseEvent<HTMLElement>, id: string, submenu: HTMLElement | null) {
    const tracking = trackingRef.current
    if (tracking && tracking.id !== id) {
      if (tracking.pendingId === id) tracking.pendingId = null
      return
    }
    cancel()
    if (id !== activeId || !submenu) {
      onLeave(id)
      return
    }

    const entry = event.currentTarget
    const origin = { x: event.clientX, y: event.clientY }
    const entryRect = entry.getBoundingClientRect()
    const submenuRect = submenu.getBoundingClientRect()
    const edgeX = submenuRect.left >= entryRect.right ? submenuRect.left : submenuRect.right
    const top = { x: edgeX, y: submenuRect.top }
    const bottom = { x: edgeX, y: submenuRect.bottom }

    function finish() {
      const pendingId = trackingRef.current?.pendingId
      dismiss()
      if (pendingId) onEnter(pendingId)
    }

    function dismiss() {
      cancel()
      onLeave(id)
    }

    function move(event: globalThis.MouseEvent) {
      const target = event.target
      if (target instanceof Node && entry.contains(target)) {
        cancel()
        return
      }
      if (!isInTriangle({ x: event.clientX, y: event.clientY }, origin, top, bottom)) finish()
    }

    // Capture runs before another entry's hover handler, so leaving the
    // corridor can immediately activate the item under the cursor.
    const controller = new AbortController()
    const { signal } = controller
    document.addEventListener('mousemove', move, { signal, capture: true })
    document.addEventListener('mouseleave', dismiss, { signal })
    window.addEventListener('blur', dismiss, { signal })
    window.addEventListener('resize', dismiss, { signal })
    window.addEventListener('scroll', dismiss, { signal, capture: true })
    trackingRef.current = {
      id,
      pendingId: null,
      stop: () => controller.abort(),
    }
    setTriangle({ origin, top, bottom })
  }

  return { handleMouseEnter, handleMouseLeave, cancel, triangle }
}
