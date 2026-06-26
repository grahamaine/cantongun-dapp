import { useEffect, useState } from "react";
import { subscribe, visibleToParty, query, T } from "../demoLedger";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "orange" | "green" | "muted";
}

function StatCard({ icon, label, value, sub, accent = "blue" }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

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
      items.push({
        id: c.contractId,
        icon: "⚡",
        text: `Trade settled: ${c.payload.instrument} × ${c.payload.qty?.toLocaleString() ?? "—"}`,
        time: "just now",
        type: "trade",
      });
    } else if (c.template === T.PrivateOrder) {
      items.push({
        id: c.contractId,
        icon: "📝",
        text: `Private order: ${c.payload.side} ${c.payload.instrument} @ ${c.payload.limitPrice}`,
        time: "pending",
        type: "trade",
      });
    } else if (c.template === T.Loan) {
      items.push({
        id: c.contractId,
        icon: "🏦",
        text: `Loan active: ${c.payload.facility ?? "credit facility"} — funded`,
        time: "active",
        type: "credit",
      });
    } else if (c.template === T.LoanRequest) {
      items.push({
        id: c.contractId,
        icon: "📋",
        text: `Loan request pending: ${c.payload.facility ?? "facility"}`,
        time: "awaiting",
        type: "credit",
      });
    } else if (c.template === T.AuditRecord) {
      items.push({
        id: c.contractId,
        icon: "🔏",
        text: `Audit record: ${c.payload.action ?? "compliance event"} logged`,
        time: "recorded",
        type: "compliance",
      });
    } else if (c.template === T.KycCredential) {
      items.push({
        id: c.contractId,
        icon: "✅",
        text: `KYC credential verified for ${c.payload.holder ?? party}`,
        time: "verified",
        type: "system",
      });
    }
  });

  if (items.length === 0) {
    items.push({
      id: "empty",
      icon: "🔒",
      text: "No contracts visible to this party yet. Submit an order to get started.",
      time: "",
      type: "system",
    });
  }

  return items.slice(0, 8);
}

export function Dashboard({ party }: { party: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  const all = visibleToParty(party);
  const orders    = query(party, T.PrivateOrder).length;
  const receipts  = query(party, T.TradeReceipt).length;
  const loans     = query(party, T.Loan).length + query(party, T.LoanRequest).length;
  const audits    = query(party, T.AuditRecord).length + query(party, T.KycCredential).length;
  const activity  = buildActivity(party);

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        <StatCard icon="⚡" label="Active Orders"     value={orders}   sub="OTC Desk"          accent="blue"   />
        <StatCard icon="✅" label="Settled Trades"    value={receipts} sub="This session"       accent="green"  />
        <StatCard icon="🏦" label="Credit Positions"  value={loans}    sub="Active & pending"  accent="orange" />
        <StatCard icon="🔏" label="Compliance Records" value={audits}  sub="Audit trail"        accent="muted"  />
      </div>

      <div className="dashboard-grid">
        {/* Activity feed */}
        <div className="dash-card">
          <h3 className="dash-card-title">🗂 Recent Activity</h3>
          <ul className="activity-list">
            {activity.map((item) => (
              <li key={item.id} className={`activity-item activity--${item.type}`}>
                <span className="activity-icon">{item.icon}</span>
                <span className="activity-text">{item.text}</span>
                {item.time && <span className="activity-time">{item.time}</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy status */}
        <div className="dash-card">
          <h3 className="dash-card-title">🔐 Privacy Status</h3>
          <div className="privacy-grid">
            <div className="privacy-row">
              <span className="privacy-dot privacy-dot--green" />
              <span>Sub-transaction privacy</span>
              <span className="privacy-status-badge good">Active</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-dot privacy-dot--green" />
              <span>Ledger-enforced NDAs</span>
              <span className="privacy-status-badge good">Enforced</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-dot privacy-dot--green" />
              <span>Competitor visibility</span>
              <span className="privacy-status-badge none">None</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-dot privacy-dot--blue" />
              <span>Party scope</span>
              <span className="privacy-status-badge party">{party}</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-dot privacy-dot--blue" />
              <span>Contracts visible</span>
              <span className="privacy-status-badge count">{all.length}</span>
            </div>
            <div className="privacy-row">
              <span className="privacy-dot privacy-dot--orange" />
              <span>Settlement model</span>
              <span className="privacy-status-badge orange">Atomic</span>
            </div>
          </div>

          <div className="zk-banner">
            zk-attested · selectively disclosed · atomically settled
          </div>
        </div>
      </div>
    </div>
  );
}
