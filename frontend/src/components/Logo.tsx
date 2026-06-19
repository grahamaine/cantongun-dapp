// CantonGun emblem — the brand badge, cropped to its central circular crest.
// The source art is a wide banner with the crest centered, so `object-fit: cover`
// on a square frame isolates the emblem cleanly.
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <span
      className="cg-logo"
      style={{ width: size, height: size }}
      role="img"
      aria-label="CantonGun logo"
    >
      <img src="/logo.png" alt="CantonGun" draggable={false} />
    </span>
  );
}
