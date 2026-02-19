'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Zap,
  Rocket,
  FileText,
  Users,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCog,
  List,
  CreditCard,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import { UserRole } from '@/types'
import { userHasMinRole } from '@/lib/rbac'

const navigation = [
  { key: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.portfolios', href: '/portfolios', icon: FolderKanban },
  { key: 'nav.products', href: '/products', icon: Package },
  { key: 'nav.features', href: '/features', icon: Zap },
  { key: 'nav.releases', href: '/releases', icon: Rocket },
  { key: 'nav.documents', href: '/documents', icon: FileText },
]

const adminNavigation = [
  { key: 'nav.users', href: '/admin/users', icon: Users },
  { key: 'nav.resources', href: '/admin/resources', icon: UserCog },
  { key: 'nav.lookups', href: '/admin/lookups', icon: List },
  { key: 'nav.rateCards', href: '/admin/rate-cards', icon: CreditCard },
  { key: 'nav.auditLog', href: '/admin/audit-log', icon: Shield },
  { key: 'nav.config', href: '/admin/config', icon: Settings },
]

// Logo Component
const Logo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="flex-shrink-0">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#1B365D' }} />
        <stop offset="100%" style={{ stopColor: '#7C3AED' }} />
      </linearGradient>
    </defs>
    {[30, 45, 60, 75, 90, 105].map((y, i) => (
      <rect
        key={i}
        x="20"
        y={y}
        width={35 - i * 2.5}
        height="8"
        fill="url(#logoGradient)"
        rx="2"
      />
    ))}
    {[30, 45, 60, 75, 90, 105].map((y, i) => (
      <rect
        key={`r-${i}`}
        x={145 + i * 2.5}
        y={y}
        width={35 - i * 2.5}
        height="8"
        fill="url(#logoGradient)"
        rx="2"
      />
    ))}
    <text
      x="100"
      y="165"
      fontFamily="Arial"
      fontSize="40"
      fontWeight="bold"
      fill="#1B365D"
      textAnchor="middle"
    >
      LP
    </text>
  </svg>
)

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const t = useLocaleStore((s) => s.t)
  const isAdmin = user?.role && userHasMinRole(user.role, UserRole.SUPER_ADMIN)

  return (
    <aside
      className={cn(
        'sidebar bg-background border-r border-border h-screen flex flex-col scrollbar-thin',
        isOpen ? 'sidebar-expanded' : 'sidebar-collapsed'
      )}
    >
      {/* Header with Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center space-x-3">
            <Logo size={40} />
            <div>
              <div className="font-bold text-primary text-lg">LeanPulse</div>
              <div className="text-xs text-muted-foreground">Enterprise Governance</div>
            </div>
          </div>
        ) : (
          <Logo size={40} />
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'menu-item flex items-center px-4 py-3 rounded-lg',
                isActive
                  ? 'active bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isOpen && 'me-3')} />
              {isOpen && <span className="font-medium text-sm">{t(item.key)}</span>}
            </Link>
          )
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {isOpen && (
              <div className="pt-4 mt-4 border-t border-border">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('nav.admin')}
                </p>
              </div>
            )}
            {!isOpen && <div className="pt-4 mt-4 border-t border-border" />}
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'menu-item flex items-center px-4 py-3 rounded-lg',
                    isActive
                      ? 'active bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isOpen && 'me-3')} />
                  {isOpen && <span className="font-medium text-sm">{t(item.key)}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
