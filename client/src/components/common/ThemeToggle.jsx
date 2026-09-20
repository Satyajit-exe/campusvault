import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="flex items-center rounded-full bg-slate-200/80 p-1 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      <button
        type="button"
        onClick={() => setThemeMode('light')}
        title="Light Mode"
        className={`rounded-full p-1.5 transition-all ${
          themeMode === 'light'
            ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400'
            : 'hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setThemeMode('dark')}
        title="Dark Mode"
        className={`rounded-full p-1.5 transition-all ${
          themeMode === 'dark'
            ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400'
            : 'hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setThemeMode('system')}
        title="System Preference"
        className={`rounded-full p-1.5 transition-all ${
          themeMode === 'system'
            ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400'
            : 'hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
