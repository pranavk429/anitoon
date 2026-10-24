import clsx from "clsx";

export function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="h-9 w-9 shrink-0 drop-shadow-[2px_2px_0_#17151C]"
      >
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill="#2B4BF2"
          stroke="#17151C"
          strokeWidth="4"
        />
        <path
          d="M19 25c-3-7-4-12-3-13 2-1 8 4 12 8"
          fill="#FFC53D"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M45 25c3-7 4-12 3-13-2-1-8 4-12 8"
          fill="#FFC53D"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 36c0-10 7-16 15-16s15 6 15 16c0 9-7 14-15 14s-15-5-15-14Z"
          fill="#FFFDF7"
          stroke="#17151C"
          strokeWidth="3.5"
        />
        <circle cx="26" cy="35" r="2.6" fill="#17151C" />
        <circle cx="38" cy="35" r="2.6" fill="#17151C" />
        <path
          d="M28 42c2 2.4 6 2.4 8 0"
          fill="none"
          stroke="#17151C"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {!markOnly && (
        <span className="font-display text-[25px] font-black leading-none tracking-[-0.06em]">
          toonify
          <span className="text-coral">.</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
