// CantonGun emblem — a precision caliper gripping a secure data node, ringed by a
// glowing circuit. Precision & control, not aggression.
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="CantonGun logo">
      <defs>
        <radialGradient id="cg-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#0a2540" />
          <stop offset="100%" stopColor="#020c18" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#cg-glow)" stroke="#2f9bff" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#1c4e80" strokeWidth="1" strokeDasharray="3 4" />
      {/* circuit ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 40}
            y1={50 + Math.sin(a) * 40}
            x2={50 + Math.cos(a) * 44}
            y2={50 + Math.sin(a) * 44}
            stroke="#2f9bff"
            strokeWidth="1.5"
          />
        );
      })}
      {/* precision caliper jaws gripping the node */}
      <path d="M30 30 L30 60 L42 60" fill="none" stroke="#7fd4ff" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 30 L70 60 L58 60" fill="none" stroke="#7fd4ff" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="34" x2="70" y2="34" stroke="#7fd4ff" strokeWidth="3" strokeLinecap="round" />
      {/* secure data node */}
      <rect x="44" y="52" width="12" height="12" rx="2" fill="#2f9bff" />
      <rect x="47" y="55" width="6" height="6" rx="1" fill="#aee4ff" />
    </svg>
  );
}
