import { Menu, MenuIcon, type MenuEntry } from './components'

const items: MenuEntry[] = [
  { id: 'overview', label: 'Overview', icon: <MenuIcon name="dashboard" /> },
  {
    id: 'projects', label: 'Projects', icon: <MenuIcon name="folder" />,
    items: [
      { id: 'all-projects', label: 'All projects' },
      { id: 'recent', label: 'Recent' },
      { id: 'shared', label: 'Shared with me' },
      { id: 'archived', label: 'Archived' },
    ],
  },
  { id: 'team', label: 'Team members', icon: <MenuIcon name="users" /> },
  { id: 'analytics', label: 'Analytics', icon: <MenuIcon name="chart" /> },
  {
    id: 'settings', label: 'Settings', icon: <MenuIcon name="settings" />,
    items: [
      { id: 'general', label: 'General' },
      { id: 'appearance', label: 'Appearance' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'integrations', label: 'Integrations' },
      { id: 'billing', label: 'Billing' },
    ],
  },
]

function App() {
  return (
    <main className="playground">
      <Menu aria-label="Main menu" items={items} />
    </main>
  )
}

export default App
