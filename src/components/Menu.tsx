import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { MenuItem, type MenuItemProps } from './MenuItem'

export type MenuEntry = Omit<MenuItemProps, 'role' | 'tabIndex' | 'hasSubmenu'> & {
  id: string
  items?: readonly MenuEntry[]
}

export type MenuProps = {
  items: readonly MenuEntry[]
  'aria-label': string
  className?: string
}

type MenuPanelProps = MenuProps & {
  anchor?: HTMLButtonElement
  focusOnOpen?: boolean
  onClose?: () => void
  onCloseAncestors?: () => void
  id?: string
}

function MenuPanel({ items, 'aria-label': label, className = '', anchor, focusOnOpen, onClose, onCloseAncestors, id }: MenuPanelProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [focusSubmenu, setFocusSubmenu] = useState(false)
  const buttonsRef = useRef(new Map<string, HTMLButtonElement>())
  const submenuPrefix = useId()
  const firstEnabled = items.findIndex((item) => !item.disabled)

  function getEnabledButtons() {
    return items.flatMap(({ id }) => {
      const button = buttonsRef.current.get(id)
      return button && !button.disabled ? [button] : []
    })
  }

  useLayoutEffect(() => {
    if (!anchor || !menuRef.current) return
    const menu = menuRef.current
    function position() {
      const rect = anchor!.getBoundingClientRect()
      const parentRect = anchor!.closest('[role="menu"]')?.getBoundingClientRect() ?? rect
      const width = menu.offsetWidth
      const left = parentRect.right + 4 + width <= window.innerWidth
        ? parentRect.right + 4 : parentRect.left - width - 4
      menu.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`
      menu.style.top = `${Math.max(8, Math.min(rect.top - 5, window.innerHeight - menu.offsetHeight - 8))}px`
    }
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    if (focusOnOpen) getEnabledButtons()[0]?.focus()
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [anchor, focusOnOpen])

  useEffect(() => {
    if (anchor) return
    function outside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenId(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [anchor])

  function closeSubmenu(restoreFocus = false) {
    if (restoreFocus && openId) buttonsRef.current.get(openId)?.focus()
    setOpenId(null)
  }

  function openSubmenu(itemId: string) {
    setFocusSubmenu(true)
    setOpenId(itemId)
  }

  function handleItemClick(event: MouseEvent<HTMLButtonElement>, item: MenuEntry) {
    item.onClick?.(event)
    if (event.defaultPrevented) return

    if (item.items?.length) {
      openSubmenu(item.id)
      return
    }

    closeSubmenu()
    onCloseAncestors?.()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('[role="menu"]') !== menuRef.current) return
    const enabled = getEnabledButtons()
    const current = enabled.indexOf(document.activeElement as HTMLButtonElement)
    const activeItem = items.find((item) => buttonsRef.current.get(item.id) === document.activeElement)

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      if (!enabled.length) return
      event.preventDefault()
      closeSubmenu()
      const next = event.key === 'Home' ? 0
        : event.key === 'End' ? enabled.length - 1
        : event.key === 'ArrowDown' ? (current + 1) % enabled.length
        : (current - 1 + enabled.length) % enabled.length
      enabled[next].focus()
    } else if (event.key === 'ArrowRight' && activeItem?.items?.length) {
      event.preventDefault()
      openSubmenu(activeItem.id)
    } else if (event.key === 'Escape' || (event.key === 'ArrowLeft' && anchor)) {
      event.preventDefault()
      event.stopPropagation()
      if (openId) closeSubmenu(true)
      else onClose?.()
    } else if (event.key === 'Tab') {
      closeSubmenu()
      onCloseAncestors?.()
    }
  }

  return (
    <div
      ref={menuRef}
      id={id}
      role="menu"
      aria-label={label}
      className={`menu ${anchor ? 'menu--submenu' : ''} ${className}`.trim()}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) closeSubmenu()
      }}
    >
      {items.map((entry, index) => {
        const { id: itemId, items: children, ...item } = entry
        const hasSubmenu = Boolean(children?.length)
        const isOpen = openId === itemId && hasSubmenu
        const submenuId = `${submenuPrefix}-${itemId}`
        return (
          <div className="menu__entry" role="none" key={itemId} onMouseEnter={() => {
            setFocusSubmenu(false)
            setOpenId(item.disabled || !hasSubmenu ? null : itemId)
          }} onMouseLeave={(event) => {
            if (!hasSubmenu) return
            const entry = event.currentTarget
            const trigger = buttonsRef.current.get(itemId)
            if (entry.contains(document.activeElement) && document.activeElement !== trigger) {
              trigger?.focus()
            }
            setOpenId((current) => current === itemId ? null : current)
          }}>
            <MenuItem
              {...item}
              ref={(button) => {
                if (button) buttonsRef.current.set(itemId, button)
                else buttonsRef.current.delete(itemId)
              }}
              role="menuitem"
              hasSubmenu={hasSubmenu}
              aria-expanded={hasSubmenu ? isOpen : undefined}
              aria-controls={isOpen ? submenuId : undefined}
              tabIndex={index === firstEnabled ? 0 : -1}
              onClick={(event) => handleItemClick(event, entry)}
              onFocus={(event) => {
                getEnabledButtons().forEach((button) => { button.tabIndex = button === event.currentTarget ? 0 : -1 })
                if (openId !== itemId) closeSubmenu()
                item.onFocus?.(event)
              }}
            />
            {isOpen && children && <MenuPanel
              id={submenuId}
              items={children}
              aria-label={`${item.label ?? itemId} submenu`}
              anchor={buttonsRef.current.get(itemId)}
              focusOnOpen={focusSubmenu}
              onClose={() => closeSubmenu(true)}
              onCloseAncestors={() => { closeSubmenu(true); onCloseAncestors?.() }}
            />}
          </div>
        )
      })}
    </div>
  )
}

export function Menu(props: MenuProps) {
  return <MenuPanel {...props} />
}
