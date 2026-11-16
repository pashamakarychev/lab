import dashboard from './assets/layout-grid.svg'
import folder from './assets/folder.svg'
import users from './assets/users.svg'
import chart from './assets/chart-no-axes-column.svg'
import settings from './assets/settings.svg'

const icons = { dashboard, folder, users, chart, settings }

export type MenuIconName = keyof typeof icons

export function MenuIcon({ name }: { name: MenuIconName }) {
  return <img src={icons[name]} alt="" width={16} height={16} />
}
