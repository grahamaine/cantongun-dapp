// ── Demo Autopilot ────────────────────────────────────────────────────────────
// One click plays the entire 90-second demo script: private orders, confidential
// match, atomic settlement, selective disclosure, and the full credit cycle —
// switching the acting party and tab at every step so the privacy story is
// visible, not just described.

import { useEffect, useRef, useState } from "react";
import { demo, query, T } from "../demoLedger";

interface AutopilotStep {
  party: string;
  tab: string;
  caption: string;
  run: () => void;
}

const ASSET = "CantonGun 5Y Bond";
const latest = (party: string, template: string) =>
  query(party, template).slice(-1)[0];

function buildSteps(): AutopilotStep[] {
  return [
    {
      party: "BankA", tab: "otc",
      caption: "BankA submits a private SELL — only the Guard can see it",
      run: () => demo.submitOrder("BankA", { asset: ASSET, quantity: 10000, side: "Sell", limitPrice: 99.5 }),
    },
    {
      party: "BankB", tab: "otc",
      caption: "BankB submits a private BUY — neither bank sees the other's order",
      run: () => demo.submitOrder("BankB", { asset: ASSET, quantity: 10000, side: "Buy", limitPrice: 99.75 }),
    },
    {
      party: "Guard", tab: "otc",
      caption: "Guard — the only party entitled to both sides — proposes a confidential match",
      run: () => {
        const orders = query("Guard", T.PrivateOrder);
        const sell = orders.filter((o) => o.payload.terms.side === "Sell" && o.payload.terms.asset === ASSET).slice(-1)[0];
        const buy  = orders.filter((o) => o.payload.terms.side === "Buy"  && o.payload.terms.asset === ASSET).slice(-1)[0];
        if (!sell || !buy) throw new Error("crossing orders not found");
        demo.proposeMatch(sell.contractId, buy.contractId, 99.6);
      },
    },
    {
      party: "BankA", tab: "otc",
      caption: "BankA approves the settlement proposal",
      run: () => demo.approve(latest("BankA", T.SettlementProposal).contractId, "BankA"),
    },
    {
      party: "BankB", tab: "otc",
      caption: "BankB approves — both signatures collected",
      run: () => demo.approve(latest("BankB", T.SettlementProposal).contractId, "BankB"),
    },
    {
      party: "Guard", tab: "otc",
      caption: "Guard settles atomically — private receipts issued to both banks",
      run: () => demo.settle(latest("Guard", T.SettlementProposal).contractId),
    },
    {
      party: "BankA", tab: "otc",
      caption: "BankA selectively discloses the trade to the Regulator — and to no one else",
      run: () => {
        const r = latest("BankA", T.TradeReceipt);
        demo.disclose("BankA", "Regulator", "OTC trade", r.payload.asset, `zk:trade-${r.contractId}`);
      },
    },
    {
      party: "Regulator", tab: "compliance",
      caption: "Regulator sees the disclosure inbox and acknowledges — competitors see nothing",
      run: () => demo.acknowledge(latest("Regulator", T.AuditRecord).contractId, "Regulator"),
    },
    {
      party: "Verifier", tab: "credit",
      caption: "Verifier issues a ZK attestation — the proof goes on-ledger, the data never does",
      run: () => demo.attestAsset("Verifier", "Logistics", {
        assetClass: "Trade receivables / invoices",
        revenueAboveThresh: true,
        invoicesValid: true,
        zeroBankruptcies: true,
        creditScore: 780,
      }),
    },
    {
      party: "Logistics", tab: "credit",
      caption: "Logistics requests confidential funding against the attested score",
      run: () => {
        const att = latest("Logistics", T.AssetAttestation);
        demo.createLoanRequest("Logistics", {
          attestationCid: att.contractId,
          assetClass: att.payload.assetClass,
          creditScore: att.payload.creditScore,
          principal: 1_000_000,
          rateBps: 850,
          tenorDays: 90,
        });
      },
    },
    {
      party: "Guard", tab: "credit",
      caption: "Guard syndicates the request to Fund — no other lender ever sees it",
      run: () => demo.syndicate(latest("Guard", T.LoanRequest).contractId, "Fund"),
    },
    {
      party: "Fund", tab: "credit",
      caption: "Fund funds against asset + score — the borrower's identity stays private",
      run: () => demo.fund(latest("Fund", T.LoanRequest).contractId, "Fund"),
    },
    {
      party: "Logistics", tab: "credit",
      caption: "Logistics repays the loan confidentially",
      run: () => {
        const l = latest("Logistics", T.Loan);
        demo.repay(l.contractId, l.payload.outstanding);
      },
    },
    {
      party: "Fund", tab: "credit",
      caption: "Fund closes the fully repaid loan",
      run: () => demo.closeLoan(latest("Fund", T.Loan).contractId),
    },
    {
      party: "BankA", tab: "dashboard",
      caption: "Done — one shared ledger, and every party saw only what it was entitled to",
      run: () => {},
    },
  ];
}

const STEP_MS = 2600;

export function DemoAutopilot({ onStep }: { onStep: (party: string, tab: string) => void }) {
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const stepsRef = useRef<AutopilotStep[]>([]);

  const stop = () => {
    window.clearTimeout(timer.current);
    setRunning(false);
  };

  const runStep = (i: number) => {
    const steps = stepsRef.current;
    const s = steps[i];
    setIdx(i);
    setCaption(s.caption);
    onStep(s.party, s.tab);
    try {
      s.run();
    } catch (e) {
      setError((e as Error).message);
      setRunning(false);
      return;
    }
    if (i + 1 < steps.length) {
      timer.current = window.setTimeout(() => runStep(i + 1), STEP_MS);
    } else {
      timer.current = window.setTimeout(() => setRunning(false), STEP_MS);
    }
  };

  const start = () => {
    demo.ensureSeeded();
    setError("");
    stepsRef.current = buildSteps();
    setRunning(true);
    runStep(0);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const total = stepsRef.current.length || 1;

  return (
    <>
      <button
        className={`autopilot-btn${running ? " autopilot-btn--running" : ""}`}
        onClick={running ? stop : start}
        title={running ? "Stop the scripted demo" : "Play the full 90-second demo automatically"}
      >
        {running ? "⏹ Stop" : "▶ Auto Demo"}
      </button>

      {(running || error) && (
        <div className={`autopilot-overlay${error ? " autopilot-overlay--error" : ""}`}>
          <div className="autopilot-overlay-top">
            <span className="autopilot-step-count">
              {error ? "⚠ Demo stopped" : `Step ${idx + 1} / ${total}`}
            </span>
            {error && (
              <button className="autopilot-dismiss" onClick={() => setError("")}>✕</button>
            )}
          </div>
          <div className="autopilot-caption">{error || caption}</div>
          {!error && (
            <div className="autopilot-track">
              <div
                className="autopilot-fill"
                style={{ width: `${((idx + 1) / total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
