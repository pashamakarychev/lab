import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SafeTriangleGeometry } from './useSafeTriangle'
import './SafeTriangleDebug.css'

type SafeTriangleDebugProps = {
  triangle: SafeTriangleGeometry | null
  anchor: HTMLButtonElement | undefined
  submenuId: string
}

export function SafeTriangleDebug({ triangle, anchor, submenuId }: SafeTriangleDebugProps) {
  const [preview, setPreview] = useState<SafeTriangleGeometry | null>(null)

  useLayoutEffect(() => {
    const submenu = document.getElementById(submenuId)
    const entry = anchor?.parentElement
    if (!anchor || !entry || !submenu) return

    function measure(origin?: SafeTriangleGeometry['origin']) {
      const anchorRect = anchor!.getBoundingClientRect()
      const entryRect = entry!.getBoundingClientRect()
      const submenuRect = submenu!.getBoundingClientRect()
      const edgeX = submenuRect.left >= entryRect.right ? submenuRect.left : submenuRect.right
      setPreview((previous) => ({
        origin: origin ?? previous?.origin ?? {
          x: anchorRect.left + anchorRect.width / 2,
          y: anchorRect.top + anchorRect.height / 2,
        },
        top: { x: edgeX, y: submenuRect.top },
        bottom: { x: edgeX, y: submenuRect.bottom },
      }))
    }

    function move(event: MouseEvent) {
      if (event.target instanceof Node && anchor!.contains(event.target)) {
        measure({ x: event.clientX, y: event.clientY })
      }
    }

    const refresh = () => measure()
    measure()
    document.addEventListener('mousemove', move)
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)
    const observer = new ResizeObserver(refresh)
    observer.observe(anchor)
    observer.observe(submenu)
    return () => {
      document.removeEventListener('mousemove', move)
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
      observer.disconnect()
    }
  }, [anchor, submenuId])

  useLayoutEffect(() => {
    // Keep the exact corridor visible after tracking ends inside the submenu.
    if (triangle) setPreview(triangle)
  }, [triangle])

  const visibleTriangle = triangle ?? preview
  if (!visibleTriangle) return null

  const { origin, top, bottom } = visibleTriangle

  return createPortal(
    <svg className="safe-triangle-debug" aria-hidden="true" focusable="false">
      <polygon points={`${origin.x},${origin.y} ${top.x},${top.y} ${bottom.x},${bottom.y}`} />
    </svg>,
    document.body,
  )
}
