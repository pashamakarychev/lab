import { createPortal } from 'react-dom'
import type { SafeTriangleGeometry } from './useSafeTriangle'
import './SafeTriangleDebug.css'

type SafeTriangleDebugProps = {
  triangle: SafeTriangleGeometry | null
}

export function SafeTriangleDebug({ triangle }: SafeTriangleDebugProps) {
  if (!triangle) return null

  const { origin, top, bottom } = triangle

  return createPortal(
    <svg className="safe-triangle-debug" aria-hidden="true" focusable="false">
      <polygon points={`${origin.x},${origin.y} ${top.x},${top.y} ${bottom.x},${bottom.y}`} />
    </svg>,
    document.body,
  )
}
