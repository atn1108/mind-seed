export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="MindSeed logo"
    >
      <defs>
        <linearGradient id="ms-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-secondary)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      {/* leaf shaped like a brain hemisphere */}
      <path
        d="M32 6c14 0 24 9 24 22 0 14-11 24-24 24-3 0-6-.5-8.6-1.5C31 44 38 36 42 25c-8 3-14 8-18 15-3-4-4.6-8.6-4.6-12C19.4 15 22 6 32 6Z"
        fill="url(#ms-leaf)"
      />
      {/* brain folds */}
      <path
        d="M31 15c4 1 6 4 6 7m-11 0c3 .5 5 2.5 5.5 5.5M38 30c3 .5 5 2.5 5.5 5"
        stroke="var(--color-primary-foreground)"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* stem + seed */}
      <path
        d="M32 58V38"
        stroke="var(--color-primary)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="59" rx="9" ry="3.2" fill="var(--color-accent)" fillOpacity="0.55" />
    </svg>
  );
}

export function LogoWordmark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <div className="leading-none">
        <div className="font-display text-xl font-semibold tracking-tight">MindSeed</div>
        <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
          Grow Your Focus.
        </div>
      </div>
    </div>
  );
}
