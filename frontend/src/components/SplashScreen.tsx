import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2200);
    const t3 = setTimeout(onDone, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={`splash splash--${phase}`}>
      <div className="splash-inner">
        <Logo size={120} />
        <h1 className="splash-title">CantonGun</h1>
        <p className="splash-sub">Confidential Capital Markets · Canton L1</p>
        <div className="splash-bar">
          <div className="splash-bar-fill" />
        </div>
      </div>
    </div>
  );
}
