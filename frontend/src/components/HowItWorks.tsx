// ── How It Works — guided walkthrough of the CantonGun demo ──────────────────
// Mirrors the 90-second demo script in the README so a first-time visitor
// (or hackathon judge) can drive the whole product without reading docs.

interface Step {
  icon: string;
  actor: string;
  actorColor: "blue" | "orange" | "green" | "violet";
  title: string;
  detail: string;
  tab?: string;
  cta?: string;
}

const STEPS: Step[] = [
  {
    icon: "📝",
    actor: "BankA · BankB",
    actorColor: "blue",
    title: "Submit private orders",
    detail:
      "BankA submits a private SELL; BankB submits a private BUY. Neither bank can see the other's order — there is no public order book to front-run.",
    tab: "otc",
    cta: "Open OTC Desk",
  },
  {
    icon: "🤝",
    actor: "Guard",
    actorColor: "violet",
    title: "Match confidentially",
    detail:
      "Switch Acting as to Guard — the only party entitled to see both sides. Guard proposes a match at a clearing price, visible to just the two counterparties.",
    tab: "otc",
    cta: "Open matching console",
  },
  {
    icon: "⚡",
    actor: "BankA · BankB · Guard",
    actorColor: "green",
    title: "Settle atomically",
    detail:
      "Each bank approves the proposal, then Guard settles. Assets swap atomically and both sides receive a private trade receipt. No one else on the network learns anything.",
    tab: "otc",
    cta: "Approve & settle",
  },
  {
    icon: "🔍",
    actor: "Regulator",
    actorColor: "orange",
    title: "Disclose selectively",
    detail:
      "Either bank clicks Disclose to Regulator. Switch to Regulator — the disclosure inbox shows the record, while Fund still sees nothing. Disclosure is an explicit, signed act.",
    tab: "compliance",
    cta: "Open Compliance",
  },
  {
    icon: "🏦",
    actor: "Verifier · Logistics · Fund",
    actorColor: "orange",
    title: "Run the credit flow",
    detail:
      "Verifier issues a ZK attestation (proof on-ledger, data never). Logistics requests funding, Guard syndicates to Fund, Fund funds, Logistics repays, Fund closes.",
    tab: "credit",
    cta: "Open Credit Desk",
  },
];

const WHY_CANTON: { need: string; publicL1: string; canton: string }[] = [
  { need: "Order details hidden from front-runners", publicL1: "Public mempool",         canton: "Sub-transaction privacy" },
  { need: "Counterparty identity confidential",      publicL1: "Pseudonymous at best",   canton: "Disclosed only to the parties" },
  { need: "Selective disclosure to a regulator",     publicL1: "All-or-nothing",         canton: "Explicit, signed disclosure" },
  { need: "Atomic, confidential settlement",         publicL1: "Visible to all",         canton: "Private atomic swap" },
  { need: "Compliance enforced in the contract",     publicL1: "Off-chain trust",        canton: "Daml choices + ZK proofs" },
];

const PILLARS = [
  {
    icon: "🔐",
    title: "Privacy by construction",
    text: "A contract is only ever shipped to its signatory and observer parties. Switching the Acting as party reveals a completely different ledger view — that is the boundary itself, not access control on top.",
  },
  {
    icon: "🔏",
    title: "ZK attestations",
    text: "Facts that must be proven without being revealed — \"revenue ≥ threshold\", \"zero bankruptcies\" — go on-ledger as zero-knowledge attestations. The proof is shared; the data never is.",
  },
  {
    icon: "⚖️",
    title: "NDAs, mathematically",
    text: "Every professional transaction begins and ends with an NDA. CantonGun enforces them in the contract model: who sees what is decided by Daml stakeholder rules, not by policy documents.",
  },
];

export function HowItWorks({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="howto">

      {/* ── Hero ── */}
      <div className="howto-hero">
        <div className="howto-hero-badge">📖 How It Works</div>
        <h2 className="howto-hero-title">
          Confidential capital markets, <span className="howto-accent">on a shared ledger</span>
        </h2>
        <p className="howto-hero-sub">
          CantonGun runs on Canton's sub-transaction privacy model: counterparties transact
          on one ledger while each party sees <em>only</em> the contracts it is entitled to.
          Follow the five steps below — the whole demo takes about 90 seconds.
        </p>
        <div className="howto-hero-hint">
          💡 Use the <strong>Acting as</strong> picker (top right) to switch parties between steps —
          watching the same ledger reveal different views <em>is</em> the demo.
        </div>
      </div>

      {/* ── Demo steps ── */}
      <div className="dash-section">
        <div className="dash-section-label">The 90-Second Demo</div>
        <ol className="howto-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="howto-step" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="howto-step-num">{i + 1}</div>
              <div className="howto-step-body">
                <div className="howto-step-top">
                  <span className="howto-step-icon">{s.icon}</span>
                  <h3 className="howto-step-title">{s.title}</h3>
                  <span className={`howto-actor howto-actor--${s.actorColor}`}>{s.actor}</span>
                </div>
                <p className="howto-step-detail">{s.detail}</p>
                {s.tab && (
                  <button className="howto-step-cta" onClick={() => onNavigate?.(s.tab!)}>
                    {s.cta} →
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Privacy pillars ── */}
      <div className="dash-section">
        <div className="dash-section-label">The Privacy Model</div>
        <div className="howto-pillars">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="howto-pillar" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="howto-pillar-icon">{p.icon}</div>
              <h3 className="howto-pillar-title">{p.title}</h3>
              <p className="howto-pillar-text">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why Canton ── */}
      <div className="dash-section">
        <div className="dash-section-label">Why Canton, Not a Public L1</div>
        <div className="dash-card howto-compare-card">
          <table className="howto-compare">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Public L1</th>
                <th>Canton / CantonGun</th>
              </tr>
            </thead>
            <tbody>
              {WHY_CANTON.map((row) => (
                <tr key={row.need}>
                  <td>{row.need}</td>
                  <td className="howto-bad">❌ {row.publicL1}</td>
                  <td className="howto-good">✅ {row.canton}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closing CTA ── */}
      <div className="howto-cta-strip">
        <span className="howto-cta-text">Ready? Start with a private order.</span>
        <button className="howto-cta-btn" onClick={() => onNavigate?.("otc")}>
          ⚡ Go to OTC Desk
        </button>
      </div>
    </div>
  );
}
