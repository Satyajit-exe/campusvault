import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Layers,
  FileQuestion,
  AlertTriangle,
  Users,
  Settings,
  ArrowLeft,
  Shield,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import CampusVaultLogo from '../../components/common/CampusVaultLogo';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Pending Approvals', path: '/admin/approvals', icon: CheckSquare },
    { label: 'Manage Resources', path: '/admin/resources', icon: FileText },
    { label: 'Academic Hierarchy', path: '/admin/hierarchy', icon: Layers },
    { label: 'Material Requests', path: '/admin/requests', icon: FileQuestion },
    { label: 'Copyright & Reports', path: '/admin/reports', icon: AlertTriangle },
    { label: 'Manage Users', path: '/admin/users', icon: Users },
  ];

  const isCurrent = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <CampusVaultLogo size="sm" />
          <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            ADMIN
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer info & exit */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Switch to Student View</span>
          </Link>
          <div className="text-[10px] text-slate-400 px-1">
            Signed in as: <strong className="text-slate-700 dark:text-slate-200">{user?.fullName}</strong>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <CampusVaultLogo size="sm" />
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Shield className="h-4 w-4 text-brand-600" />
            <span>CampusVault SuperAdmin Central Console</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Visit Portal
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4 text-brand-500" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
