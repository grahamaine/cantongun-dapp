import { useEffect, useRef, useState } from "react";
import { subscribe, visibleToParty, query, T } from "../demoLedger";

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * ease));
      if (p < 1) requestAnimationFrame(frame);
      else prev.current = target;
    };
    requestAnimationFrame(frame);
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
}

function StatCard({ icon, label, value, sub, accent, delay = 0 }: StatCardProps) {
  const animated = useCountUp(value);
  return (
    <div
      className={`stat-card stat-card--${accent}`}
      style={{ animationDelay: `${delay}ms` }}
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
      <div className="stat-shimmer" />
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
      items.push({ id: c.contractId, icon: "⚡", text: `Trade settled: ${c.payload.instrument} × ${c.payload.qty?.toLocaleString() ?? "—"}`, time: "just now", type: "trade" });
    } else if (c.template === T.PrivateOrder) {
      items.push({ id: c.contractId, icon: "📝", text: `Private order: ${c.payload.side} ${c.payload.instrument} @ ${c.payload.limitPrice}`, time: "pending", type: "trade" });
    } else if (c.template === T.Loan) {
      items.push({ id: c.contractId, icon: "🏦", text: `Loan active: ${c.payload.facility ?? "credit facility"} — funded`, time: "active", type: "credit" });
    } else if (c.template === T.LoanRequest) {
      items.push({ id: c.contractId, icon: "📋", text: `Loan request pending: ${c.payload.facility ?? "facility"}`, time: "awaiting", type: "credit" });
    } else if (c.template === T.AuditRecord) {
      items.push({ id: c.contractId, icon: "🔏", text: `Audit record: ${c.payload.action ?? "compliance event"} logged`, time: "recorded", type: "compliance" });
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard({ party }: { party: string }) {
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

      {/* ── Section label ── */}
      <div className="dash-section-label">Overview</div>

      {/* ── Stat cards ── */}
      <div className="dashboard-stats">
        <StatCard icon="⚡" label="Active Orders"      value={orders}   sub="OTC Desk"         accent="blue"   delay={0}   />
        <StatCard icon="✅" label="Settled Trades"     value={receipts} sub="This session"      accent="green"  delay={80}  />
        <StatCard icon="🏦" label="Credit Positions"   value={loans}    sub="Active & pending"  accent="orange" delay={160} />
        <StatCard icon="🔏" label="Compliance Records" value={audits}   sub="Audit trail"       accent="violet" delay={240} />
      </div>

      {/* ── Bottom grid ── */}
      <div className="dash-section-label" style={{ marginTop: 8 }}>Live Feed</div>

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

      </div>
    </div>
  );
}
