type IconProps = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export const PlusIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const MinusIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}><path d="M5 12h14" /></svg>
);
export const HeartIcon = ({ className, size = 20, filled = false }: IconProps & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} className={className}>
    <path d="M12 20.3s-7.5-4.6-9.2-9.4C1.6 7.4 3.8 4 7.2 4c2 0 3.5 1.1 4.8 2.8C13.3 5.1 14.8 4 16.8 4c3.4 0 5.6 3.4 4.4 6.9-1.7 4.8-9.2 9.4-9.2 9.4Z" />
  </svg>
);
export const SearchIcon = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const CloseIcon = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const PhoneIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6.6 3.5h2.6l1.5 4-2 1.3a11.3 11.3 0 0 0 6.5 6.5l1.3-2 4 1.5v2.6a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
  </svg>
);
export const TelegramIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="m21 4-3.2 16-5.4-4.6L9 18.6V14l9-8-11.2 6.9L3 11.6Z" /></svg>
);
export const ChatIcon = ({ className, size = 24 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20 12.2c0 4-3.6 7.3-8 7.3-1.2 0-2.3-.2-3.3-.6L4 20l1.2-3.6A6.9 6.9 0 0 1 4 12.2C4 8.3 7.6 5 12 5s8 3.3 8 7.2Z" />
  </svg>
);
export const MessageIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>
);
export const HomeIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1Z" /></svg>
);
export const MenuGridIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" />
  </svg>
);
export const BasketIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M5 9h14l-1.3 9.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8Z" /><path d="M9 9V7.5a3 3 0 0 1 6 0V9" /></svg>
);
export const PinIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
);
export const ArrowUpIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
);
export const GlobeIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5Z" /></svg>
);
export const TrashIcon = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 12h9.4l.8-12" /></svg>
);
export const ChevronIcon = ({ className, size = 18, direction = 'down' }: IconProps & { direction?: 'up' | 'down' | 'left' | 'right' }) => {
  const d = { down: 'm6 9 6 6 6-6', up: 'm6 15 6-6 6 6', left: 'm15 6-6 6 6 6', right: 'm9 6 6 6-6 6' }[direction];
  return <svg {...base(size)} className={className}><path d={d} /></svg>;
};
export const ClockIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const DragIcon = ({ className, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={3} /></svg>
);
export const TagIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12.6 3.5H6a2.5 2.5 0 0 0-2.5 2.5v6.6c0 .5.2 1 .6 1.4l9 9c.8.8 2 .8 2.8 0l6.6-6.6c.8-.8.8-2 0-2.8l-9-9c-.4-.4-.9-.6-1.4-.6Z" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
export const InfoIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5" /><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" /></svg>
);
