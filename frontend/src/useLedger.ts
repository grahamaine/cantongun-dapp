import { useEffect, useState } from "react";
import { demo, DemoContract } from "./demoLedger";

/** Re-renders whenever the demo ledger changes; returns this party's view of a template. */
export function useQuery(party: string, template: string): DemoContract[] {
  const [, tick] = useState(0);
  useEffect(() => {
    demo.ensureSeeded();
    const unsub = demo.subscribe(() => tick((n) => n + 1));
    return () => {
      unsub();
    };
  }, []);
  return demo.query(party, template);
}

/** Everything this party is entitled to see, across all templates. */
export function useVisible(party: string): DemoContract[] {
  const [, tick] = useState(0);
  useEffect(() => {
    demo.ensureSeeded();
    const unsub = demo.subscribe(() => tick((n) => n + 1));
    return () => {
      unsub();
    };
  }, []);
  return demo.visibleToParty(party);
}
