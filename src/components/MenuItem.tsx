import type { ComponentPropsWithRef, ReactNode } from 'react'
import chevronRight from './assets/chevron-right.svg'
import './Menu.css'

export type MenuItemProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  label?: string
  hasSubmenu?: boolean
  icon?: ReactNode
}

export function MenuItem({
  label = 'Label',
  hasSubmenu = false,
  icon,
  className = '',
  type = 'button',
  ...props
}: MenuItemProps) {
  return (
    <button
      {...props}
      type={type}
      className={`menu-item body-small ${className}`.trim()}
      aria-haspopup={hasSubmenu ? 'menu' : undefined}
    >
      {icon && <span className="menu-item__icon" aria-hidden="true">{icon}</span>}
      <span className="menu-item__label">{label}</span>
      {hasSubmenu && <img className="menu-item__chevron" src={chevronRight} alt="" width={16} height={16} />}
    </button>
  )
}
