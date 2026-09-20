import React from 'react';

export default function CampusVaultLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' },
    xl: { icon: 56, text: 'text-3xl' },
  };

  const { icon, text } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* SVG Icon: Vault Shield + Open Book Pages + Search Lens + Digital Core */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="cv_grad_primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="60%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="cv_grad_vault" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="cv_cyan_glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Vault Outer Shield / Rounded Polygon */}
        <path
          d="M24 3L40 9V23C40 33.2 33.2 42.4 24 45C14.8 42.4 8 33.2 8 23V9L24 3Z"
          fill="url(#cv_grad_primary)"
        />

        {/* Inner Subtle Vault Shading */}
        <path
          d="M24 6L37 11V22.5C37 31 31.5 38.6 24 41C16.5 38.6 11 31 11 22.5V11L24 6Z"
          fill="url(#cv_grad_vault)"
        />

        {/* Left Book Page */}
        <path
          d="M23 18C19 18 16 19.2 14 20.2V31.5C16 30.5 19 29.5 23 29.5V18Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />

        {/* Right Book Page */}
        <path
          d="M25 18C29 18 32 19.2 34 20.2V31.5C32 30.5 29 29.5 25 29.5V18Z"
          fill="#FFFFFF"
          fillOpacity="0.8"
        />

        {/* Book Spine */}
        <line x1="24" y1="18" x2="24" y2="30.5" stroke="#4F46E5" strokeWidth="1.5" />

        {/* Search Lens Ring (Integrated into the Vault / Book) */}
        <circle
          cx="28"
          cy="25"
          r="6"
          stroke="url(#cv_cyan_glow)"
          strokeWidth="2.5"
          fill="#0F172A"
          fillOpacity="0.4"
        />

        {/* Search Lens Handle */}
        <line
          x1="32.5"
          y1="29.5"
          x2="37.5"
          y2="34.5"
          stroke="url(#cv_cyan_glow)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Digital Vault Center Spark */}
        <circle cx="28" cy="25" r="2" fill="#FFFFFF" />
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${text} tracking-tight font-extrabold text-slate-900 dark:text-white ${textClassName}`}>
            Campus<span className="text-brand-500 dark:text-brand-400">Vault</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Academic Hub
          </span>
        </div>
      )}
    </div>
  );
}
