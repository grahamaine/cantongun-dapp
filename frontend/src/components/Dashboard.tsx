import { useEffect, useRef, useState } from "react";
import { subscribe, visibleToParty, query, T, type DemoContract } from "../demoLedger";

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * ease));
      if (p < 1) raf = requestAnimationFrame(frame);
      else prev.current = target;
    };
    raf = requestAnimationFrame(frame);
    // rAF is throttled in hidden tabs — guarantee we land on the target.
    const settle = window.setTimeout(() => {
      prev.current = target;
      setDisplay(target);
    }, duration + 50);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(settle); };
  }, [target, duration]);
  return display;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  sub?: string;
  accent: "blue" | "orange" | "green" | "violet";
  delay?: number;
  onClick?: () => void;
}

function StatCard({ icon, label, value, sub, accent, delay = 0, onClick }: StatCardProps) {
  const animated = useCountUp(value);
  return (
    <div
      className={`stat-card stat-card--${accent}${onClick ? " stat-card--clickable" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-card-glow" />
      <div className="stat-icon-wrap">
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-body">
        <div className="stat-value">{animated}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      {onClick && <div className="stat-arrow">›</div>}
      <div className="stat-shimmer" />
    </div>
  );
}

// ── Financial Summary strip ───────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function FinancialSummary({ party }: { party: string }) {
  const receipts = query(party, T.TradeReceipt);
  const loans    = query(party, T.Loan);
  const pending  = query(party, T.SettlementProposal);
  const attests  = query(party, T.AssetAttestation);

  const notional = receipts.reduce((s, r) => s + (r.payload.notional ?? 0), 0);
  const credit   = loans.reduce((s, l) => s + (l.payload.principal ?? 0), 0);

  const items = [
    { label: "Notional Traded",    value: fmt(notional), icon: "📈", color: "blue"   },
    { label: "Credit Deployed",    value: fmt(credit),   icon: "🏦", color: "orange" },
    { label: "Pending Settlements",value: String(pending.length),  icon: "⏳", color: "violet" },
    { label: "ZK Attestations",    value: String(attests.length),  icon: "🔏", color: "green"  },
  ];

  return (
    <div className="fin-summary">
      {items.map((item) => (
        <div key={item.label} className={`fin-item fin-item--${item.color}`}>
          <span className="fin-icon">{item.icon}</span>
          <div className="fin-body">
            <span className="fin-value">{item.value || "—"}</span>
            <span className="fin-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const actions = [
    { icon: "⚡", label: "OTC Desk",    tab: "otc",        accent: "blue"   },
    { icon: "🏦", label: "Credit Desk", tab: "credit",     accent: "orange" },
    { icon: "🔏", label: "Compliance",  tab: "compliance", accent: "violet" },
    { icon: "📖", label: "How It Works", tab: "how",        accent: "green"  },
  ] as const;

  return (
    <div className="quick-actions">
      {actions.map((a) => (
        <button
          key={a.label}
          className={`quick-btn quick-btn--${a.accent}`}
          onClick={() => a.tab && onNavigate?.(a.tab)}
          disabled={!a.tab && !onNavigate}
          title={a.tab ? `Go to ${a.label}` : ""}
        >
          <span className="quick-btn-icon">{a.icon}</span>
          <span className="quick-btn-label">{a.label}</span>
          {a.tab && <span className="quick-btn-arrow">→</span>}
        </button>
      ))}
    </div>
  );
}

// ── Activity feed ─────────────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  type: "trade" | "credit" | "compliance" | "system";
}

function buildActivity(party: string): ActivityItem[] {
  const contracts = visibleToParty(party);
  const items: ActivityItem[] = [];

  contracts.forEach((c) => {
    if (c.template === T.TradeReceipt) {
      items.push({ id: c.contractId, icon: "⚡", text: `Trade settled: ${c.payload.instrument ?? c.payload.asset} × ${(c.payload.qty ?? c.payload.quantity)?.toLocaleString() ?? "—"}`, time: "just now", type: "trade" });
    } else if (c.template === T.PrivateOrder) {
      items.push({ id: c.contractId, icon: "📝", text: `Private order: ${c.payload.side ?? c.payload.terms?.side} ${c.payload.instrument ?? c.payload.terms?.asset} @ ${c.payload.limitPrice ?? c.payload.terms?.limitPrice}`, time: "pending", type: "trade" });
    } else if (c.template === T.Loan) {
      items.push({ id: c.contractId, icon: "🏦", text: `Loan active: ${c.payload.facility ?? c.payload.assetClass ?? "credit facility"} — funded`, time: "active", type: "credit" });
    } else if (c.template === T.LoanRequest) {
      items.push({ id: c.contractId, icon: "📋", text: `Loan request pending: ${c.payload.facility ?? c.payload.assetClass ?? "facility"}`, time: "awaiting", type: "credit" });
    } else if (c.template === T.AuditRecord) {
      items.push({ id: c.contractId, icon: "🔏", text: `Audit record: ${c.payload.action ?? c.payload.subject ?? "compliance event"} logged`, time: "recorded", type: "compliance" });
    } else if (c.template === T.KycCredential) {
      items.push({ id: c.contractId, icon: "✅", text: `KYC credential verified for ${c.payload.holder ?? party}`, time: "verified", type: "system" });
    }
  });

  if (items.length === 0) {
    items.push({ id: "empty", icon: "🔒", text: "No contracts visible yet — submit an order to get started.", time: "", type: "system" });
  }

  return items.slice(0, 8);
}

// ── Privacy row ───────────────────────────────────────────────────────────────
function PrivacyRow({ dot, label, badge, badgeType, delay = 0 }: {
  dot: "green" | "blue" | "orange";
  label: string;
  badge: string;
  badgeType: string;
  delay?: number;
}) {
  return (
    <div className="privacy-row" style={{ animationDelay: `${delay}ms` }}>
      <span className={`privacy-dot privacy-dot--${dot}`} />
      <span className="privacy-row-label">{label}</span>
      <span className={`privacy-status-badge ${badgeType}`}>{badge}</span>
    </div>
  );
}

// ── Party Scope card ──────────────────────────────────────────────────────────
function buildScope(party: string, contracts: DemoContract[]) {
  const tally = new Map<string, { count: number; templates: Set<string> }>();

  for (const c of contracts) {
    for (const p of c.stakeholders) {
      if (p === party) continue;
      const entry = tally.get(p) ?? { count: 0, templates: new Set() };
      entry.count++;
      entry.templates.add(c.template);
      tally.set(p, entry);
    }
  }

  return Array.from(tally.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);
}

function PartyScopeCard({ party, contracts }: { party: string; contracts: DemoContract[] }) {
  const scope = buildScope(party, contracts);

  return (
    <div className="dash-card dash-card--scope" style={{ animationDelay: "0.24s" }}>
      <div className="dash-card-header">
        <h3 className="dash-card-title">🌐 Party Scope</h3>
        <span className="dash-card-badge">{scope.length} visible</span>
      </div>
      {scope.length === 0 ? (
        <p className="scope-empty">No counterparties yet. Submit an order to connect.</p>
      ) : (
        <ul className="scope-list">
          {scope.map(([p, info]) => {
            const templateList = Array.from(info.templates)
              .map((t) => t.replace(/([A-Z])/g, " $1").trim())
              .join(", ");
            return (
              <li key={p} className="scope-item" style={{ animationDelay: `${scope.indexOf(scope.find(s => s[0] === p)!) * 60}ms` }}>
                <div className="scope-party-icon">
                  {p[0]}
                </div>
                <div className="scope-body">
                  <span className="scope-name">{p}</span>
                  <span className="scope-detail">{templateList}</span>
                </div>
                <span className="scope-count">{info.count}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="scope-footer">
        <span className="scope-note">Inferred from shared contract stakeholders</span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard({ party, onNavigate }: { party: string; onNavigate?: (tab: string) => void }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  const all      = visibleToParty(party);
  const orders   = query(party, T.PrivateOrder).length;
  const receipts = query(party, T.TradeReceipt).length;
  const loans    = query(party, T.Loan).length + query(party, T.LoanRequest).length;
  const audits   = query(party, T.AuditRecord).length + query(party, T.KycCredential).length;
  const activity = buildActivity(party);

  return (
    <div className="dashboard">

      {/* ── Aurora background orbs ── */}
      <div className="dash-orb dash-orb--1" />
      <div className="dash-orb dash-orb--2" />
      <div className="dash-orb dash-orb--3" />

      {/* ── Overview: stat cards + financial strip ── */}
      <div className="dash-section">
        <div className="dash-section-label">Overview</div>
        <div className="dashboard-stats">
          <StatCard icon="⚡" label="Active Orders"      value={orders}   sub="OTC Desk"         accent="blue"   delay={0}   onClick={() => onNavigate?.("otc")} />
          <StatCard icon="✅" label="Settled Trades"     value={receipts} sub="This session"      accent="green"  delay={80}  onClick={() => onNavigate?.("otc")} />
          <StatCard icon="🏦" label="Credit Positions"   value={loans}    sub="Active & pending"  accent="orange" delay={160} onClick={() => onNavigate?.("credit")} />
          <StatCard icon="🔏" label="Compliance Records" value={audits}   sub="Audit trail"       accent="violet" delay={240} onClick={() => onNavigate?.("compliance")} />
        </div>
        <FinancialSummary party={party} />
      </div>

      {/* ── Quick actions ── */}
      <div className="dash-section">
        <div className="dash-section-label">Quick Actions</div>
        <QuickActions onNavigate={onNavigate} />
      </div>

      {/* ── Bottom grid ── */}
      <div className="dash-section">
        <div className="dash-section-label">Live Feed</div>
        <div className="dashboard-grid">

          {/* Activity feed */}
          <div className="dash-card dash-card--activity">
            <div className="dash-card-header">
              <h3 className="dash-card-title">🗂 Recent Activity</h3>
              <span className="dash-card-badge">{activity.length}</span>
            </div>
            <ul className="activity-list">
              {activity.map((item, i) => (
                <li
                  key={item.id}
                  className={`activity-item activity--${item.type}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="activity-icon">{item.icon}</span>
                  <span className="activity-text">{item.text}</span>
                  {item.time && <span className="activity-time">{item.time}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy status */}
          <div className="dash-card dash-card--privacy">
            <div className="dash-card-header">
              <h3 className="dash-card-title">🔐 Privacy Status</h3>
              <span className="dash-live-pill">● LIVE</span>
            </div>
            <div className="privacy-grid">
              <PrivacyRow dot="green"  label="Sub-transaction privacy"  badge="Active"   badgeType="good"   delay={0}   />
              <PrivacyRow dot="green"  label="Ledger-enforced NDAs"     badge="Enforced" badgeType="good"   delay={50}  />
              <PrivacyRow dot="green"  label="Competitor visibility"    badge="None"     badgeType="none"   delay={100} />
              <PrivacyRow dot="blue"   label="Party scope"              badge={party}    badgeType="party"  delay={150} />
              <PrivacyRow dot="blue"   label="Contracts visible"        badge={String(all.length)} badgeType="count" delay={200} />
              <PrivacyRow dot="orange" label="Settlement model"         badge="Atomic"   badgeType="orange" delay={250} />
            </div>
            <div className="zk-banner">
              <span className="zk-text">zk-attested · selectively disclosed · atomically settled</span>
            </div>
          </div>

          {/* Party scope */}
          <PartyScopeCard party={party} contracts={all} />

        </div>
      </div>
    </div>
  );
}
