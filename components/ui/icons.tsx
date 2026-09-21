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
export const DownloadIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" /></svg>
);
export const StarIcon = ({ className, size = 20, filled = false }: IconProps & { filled?: boolean }) => (
  <svg {...base(size)} strokeWidth={filled ? 0 : 1.6} fill={filled ? 'currentColor' : 'none'} className={className}>
    <path d="M12 3.4l2.47 5.18 5.63.72-4.16 3.94 1.1 5.66L12 16.1l-5.04 2.8 1.1-5.66-4.16-3.94 5.63-.72Z" strokeLinejoin="round" />
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
export const LockIcon = ({ className, size = 14 }: IconProps) => (
  <svg {...base(size)} className={className}><rect x="5" y="10.5" width="14" height="10" rx="2.2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></svg>
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

/* ------------------------------------------------------------------ channels
 * Brand marks drawn to the same 24px grid, weight and round joins as the rest
 * of the set, rather than pasted in from a third-party icon pack — a row of
 * mismatched logos is the quickest way to make a careful page look assembled.
 */

export const WhatsappIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20 11.7a8 8 0 0 1-11.9 7L4 20l1.4-4a8 8 0 1 1 14.6-4.3Z" />
    <path d="M9.3 8.8c.3-.1.6 0 .8.3l.7 1.2c.1.3.1.6-.1.8l-.5.5a5.6 5.6 0 0 0 2.4 2.4l.5-.5c.2-.2.5-.3.8-.1l1.2.7c.3.2.4.5.3.8-.2.6-.8 1-1.5 1-2.8-.2-5.1-2.5-5.3-5.3 0-.7.3-1.3 1-1.5Z" />
  </svg>
);

export const InstagramIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="16.9" cy="7.1" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const FacebookIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <path d="M15 8.2h-1.4c-.9 0-1.6.7-1.6 1.6V20M9.8 12.6h4.6" />
  </svg>
);

export const TiktokIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M14.2 3.5v10.9a3.6 3.6 0 1 1-3.6-3.6" />
    <path d="M14.2 3.5a5 5 0 0 0 5 5" />
  </svg>
);

export const YoutubeIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.4 9.4l4.6 2.6-4.6 2.6Z" fill="currentColor" />
  </svg>
);

export const DirectionsIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M20.5 3.5 3.5 10.2l7.2 2.9 2.6 7.4Z" /></svg>
);

export const PlayIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M8 5.2 19 12 8 18.8Z" /></svg>
);

export const FilmIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M7.5 5v14M16.5 5v14M3 12h18" />
  </svg>
);

export const BellIcon = ({ className, size = 20, muted = false }: IconProps & { muted?: boolean }) => (
  <svg {...base(size)} className={className}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
    {muted ? <path d="M4 4l16 16" /> : null}
  </svg>
);
