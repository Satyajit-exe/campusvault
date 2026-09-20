import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bookmark,
  TrendingUp,
  UploadCloud,
  FileQuestion,
  BookOpen,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import CampusVaultLogo from './CampusVaultLogo';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center">
            <CampusVaultLogo size="md" />
          </Link>

          {/* Desktop Search Trigger */}
          <Link
            to="/search"
            className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 px-4 py-1.5 text-xs font-medium text-slate-500 hover:border-brand-300 hover:bg-white hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-850 dark:hover:text-slate-200 transition-all shadow-inner"
          >
            <Search className="h-3.5 w-3.5 text-brand-500" />
            <span>Search PYQs, notes, subjects...</span>
            <kbd className="ml-2 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              /
            </kbd>
          </Link>
        </div>

        {/* Center/Right Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/search"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive('/search')
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <Compass className="h-4 w-4" />
            Explore
          </Link>

          <Link
            to="/subjects/dbms/pyqs"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive('/subjects/dbms/pyqs')
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            PYQs
          </Link>

          <Link
            to="/request"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive('/request')
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <FileQuestion className="h-4 w-4" />
            Request Material
          </Link>

          {user && (
            <Link
              to="/contribute"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/contribute')
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <UploadCloud className="h-4 w-4 text-brand-500" />
              Contribute
            </Link>
          )}
        </nav>

        {/* Right side items: Theme + Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 p-1 pr-3 text-sm font-medium text-slate-700 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-violetAccent-500 text-xs font-bold text-white shadow-sm">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate text-xs font-semibold">
                  {user.fullName.split(' ')[0]}
                </span>
                {user.role === 'ADMIN' && (
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Admin
                  </span>
                )}
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                >
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    <p className="mt-1 text-[10px] font-medium text-brand-600 dark:text-brand-400">
                      {user.branch?.code || 'Student'} • Semester {user.currentSemester || '3'}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Dashboard
                    </Link>

                    <Link
                      to="/saved"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Bookmark className="h-4 w-4 text-slate-400" />
                      Saved Materials
                    </Link>

                    <Link
                      to="/progress"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                      Study Progress
                    </Link>

                    <Link
                      to="/my-contributions"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <UploadCloud className="h-4 w-4 text-slate-400" />
                      My Contributions
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/70 dark:text-brand-300 dark:hover:bg-brand-900"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Portal
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-brand-600 to-violetAccent-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden dark:border-slate-800 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white p-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-3">
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Search className="h-4 w-4 text-brand-500" />
              Search materials...
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Explore Catalog
            </Link>
            <Link
              to="/subjects/dbms/pyqs"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Previous Year Questions (PYQs)
            </Link>
            <Link
              to="/request"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Request Missing Material
            </Link>
            {user && (
              <>
                <Link
                  to="/contribute"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                >
                  Contribute PDF
                </Link>
                <Link
                  to="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Saved Materials
                </Link>
                <Link
                  to="/progress"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Study Progress
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
