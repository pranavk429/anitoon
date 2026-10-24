import clsx from "clsx";

export function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="h-8 w-8 shrink-0 drop-shadow-[0_2px_4px_rgba(40,34,22,0.12)]"
      >
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill="#4B63FF"
          stroke="#111111"
          strokeWidth="3"
        />
        <path
          d="M19 25c-3-7-4-12-3-13 2-1 8 4 12 8"
          fill="#FFC53D"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M45 25c3-7 4-12 3-13-2-1-8 4-12 8"
          fill="#FFC53D"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 36c0-10 7-16 15-16s15 6 15 16c0 9-7 14-15 14s-15-5-15-14Z"
          fill="#FEFDF9"
          stroke="#111111"
          strokeWidth="2.5"
        />
        <circle cx="26" cy="35" r="2.6" fill="#111111" />
        <circle cx="38" cy="35" r="2.6" fill="#111111" />
        <path
          d="M28 42c2 2.2 6 2.2 8 0"
          fill="none"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {!markOnly && (
        <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.03em] text-[#111111]">
          anitoon
          <span className="text-[#4B63FF]">.</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
