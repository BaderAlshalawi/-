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
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { userHasMinRole } from '@/lib/rbac'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolios', href: '/portfolios', icon: FolderKanban },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Features', href: '/features', icon: Zap },
  { name: 'Releases', href: '/releases', icon: Rocket },
  { name: 'Documents', href: '/documents', icon: FileText },
]

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Audit Log', href: '/admin/audit-log', icon: Shield },
  { name: 'Config', href: '/admin/config', icon: Settings },
]

// Logo Component
const Logo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="flex-shrink-0">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#3B82F6' }} />
        <stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
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
      fill="#1E40AF"
      textAnchor="middle"
    >
      Lean
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
  const isAdmin = user?.role && userHasMinRole(user.role, UserRole.ADMIN)

  return (
    <aside
      className={cn(
        'sidebar bg-white border-r border-gray-200 h-screen flex flex-col scrollbar-thin',
        isOpen ? 'sidebar-expanded' : 'sidebar-collapsed'
      )}
    >
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center space-x-3">
            <Logo size={40} />
            <div>
              <div className="font-bold text-gray-800 text-lg">Lean</div>
              <div className="text-xs text-gray-500">Business Efficiency</div>
            </div>
          </div>
        ) : (
          <Logo size={40} />
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'menu-item flex items-center px-4 py-3 rounded-lg',
                isActive
                  ? 'active bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isOpen && 'mr-3')} />
              {isOpen && <span className="font-medium text-sm">{item.name}</span>}
            </Link>
          )
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {isOpen && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin
                </p>
              </div>
            )}
            {!isOpen && <div className="pt-4 mt-4 border-t border-gray-200" />}
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'menu-item flex items-center px-4 py-3 rounded-lg',
                    isActive
                      ? 'active bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isOpen && 'mr-3')} />
                  {isOpen && <span className="font-medium text-sm">{item.name}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
