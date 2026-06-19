import { useState } from "react";
import { Logo } from "./components/Logo";
import { OtcDesk } from "./components/OtcDesk";
import { CreditDesk } from "./components/CreditDesk";
import { ComplianceDesk } from "./components/ComplianceDesk";
import { demo } from "./demoLedger";

type Tab = "otc" | "credit" | "compliance";

const PARTIES = ["BankA", "BankB", "Logistics", "Fund", "Verifier", "Guard", "Regulator"];

export function App() {
  const [tab, setTab] = useState<Tab>("otc");
  const [party, setParty] = useState<string>("BankA");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Logo size={42} />
          <div>
            <h1>CantonGun</h1>
            <p className="tagline">Confidential capital markets · Canton L1</p>
          </div>
        </div>
        <label className="party-picker">
          <span>Acting as</span>
          <select value={party} onChange={(e) => setParty(e.target.value)}>
            {PARTIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="privacy-banner">
        🔒 You only see contracts <strong>{party}</strong> is entitled to. Privacy is
        enforced by the ledger — competitors see nothing.
      </div>

      <nav className="tabs">
        <button className={tab === "otc" ? "active" : ""} onClick={() => setTab("otc")}>
          Confidential OTC Desk
        </button>
        <button className={tab === "credit" ? "active" : ""} onClick={() => setTab("credit")}>
          Private Credit Desk
        </button>
        <button
          className={tab === "compliance" ? "active" : ""}
          onClick={() => setTab("compliance")}
        >
          Compliance &amp; Disclosure
        </button>
        <button className="reset" onClick={() => demo.resetDemo()} title="Reset demo ledger">
          ↺ Reset
        </button>
      </nav>

      <main>
        {tab === "otc" && <OtcDesk party={party} />}
        {tab === "credit" && <CreditDesk party={party} />}
        {tab === "compliance" && <ComplianceDesk party={party} />}
      </main>

      <footer>
        <span>We enforce NDAs mathematically.</span>
        <span>zk-attested · selectively disclosed · atomically settled</span>
      </footer>
    </div>
  );
}
