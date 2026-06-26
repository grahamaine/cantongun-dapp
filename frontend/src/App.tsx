import { useState, useCallback, useEffect } from "react";
import { Logo } from "./components/Logo";
import { OtcDesk } from "./components/OtcDesk";
import { CreditDesk } from "./components/CreditDesk";
import { ComplianceDesk } from "./components/ComplianceDesk";
import { Dashboard } from "./components/Dashboard";
import { SplashScreen } from "./components/SplashScreen";
import { demo, subscribe, visibleToParty } from "./demoLedger";

type Tab = "dashboard" | "otc" | "credit" | "compliance";

const PARTIES = ["BankA", "BankB", "Logistics", "Fund", "Verifier", "Guard", "Regulator"];

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard",  icon: "📊", label: "Dashboard" },
  { id: "otc",        icon: "⚡", label: "OTC Desk" },
  { id: "credit",     icon: "🏦", label: "Credit Desk" },
  { id: "compliance", icon: "🔏", label: "Compliance" },
];

const PAGE_TITLE: Record<Tab, string> = {
  dashboard:  "Dashboard",
  otc:        "Confidential OTC Desk",
  credit:     "Private Credit Desk",
  compliance: "Compliance & Disclosure",
};

interface Notification {
  id: string;
  text: string;
  time: number;
}

export function App() {
  const [splash, setSplash]           = useState(true);
  const [tab, setTab]                 = useState<Tab>("dashboard");
  const [party, setParty]             = useState<string>("BankA");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread]           = useState(0);

  const hideSplash = useCallback(() => setSplash(false), []);

  // Track ledger events as notifications
  useEffect(() => {
    let prev = visibleToParty(party).length;
    return subscribe(() => {
      const next = visibleToParty(party).length;
      if (next > prev) {
        setNotifications((ns) => [
          {
            id: `n-${Date.now()}`,
            text: `New contract visible to ${party}`,
            time: Date.now(),
          },
          ...ns.slice(0, 19),
        ]);
        setUnread((u) => u + 1);
      }
      prev = next;
    });
  }, [party]);

  // Reset unread when panel opened
  const openNotif = () => { setNotifOpen((o) => !o); setUnread(0); };

  if (splash) return <SplashScreen onDone={hideSplash} />;

  return (
    <div className={`layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={44} />
          {sidebarOpen && (
            <div>
              <span className="sidebar-title">CantonGun</span>
              <span className="sidebar-tagline">Canton L1</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
              title={!sidebarOpen ? label : undefined}
            >
              <span className="nav-icon">{icon}</span>
              {sidebarOpen && <span className="nav-label">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item reset-btn"
            onClick={() => demo.resetDemo()}
            title="Reset demo ledger"
          >
            <span className="nav-icon">↺</span>
            {sidebarOpen && <span className="nav-label">Reset Demo</span>}
          </button>
        </div>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title">
              {NAV.find((n) => n.id === tab)?.icon}{" "}
              {PAGE_TITLE[tab]}
            </h2>
          </div>

          <div className="topbar-right">
            {/* Notification bell */}
            <div className="notif-wrap">
              <button className="notif-btn" onClick={openNotif} title="Notifications">
                🔔
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-header">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No activity yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="notif-item">
                        <span className="notif-dot" />
                        <span className="notif-text">{n.text}</span>
                        <span className="notif-ts">{new Date(n.time).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <label className="party-picker">
              <span>Acting as</span>
              <select value={party} onChange={(e) => setParty(e.target.value)}>
                {PARTIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="privacy-banner">
          🔒 You only see contracts <strong>{party}</strong> is entitled to. Privacy is
          enforced by the ledger — competitors see nothing.
        </div>

        <main>
          {tab === "dashboard"  && <Dashboard party={party} />}
          {tab === "otc"        && <OtcDesk party={party} />}
          {tab === "credit"     && <CreditDesk party={party} />}
          {tab === "compliance" && <ComplianceDesk party={party} />}
        </main>

        <footer>
          <span>We enforce NDAs mathematically.</span>
          <span>zk-attested · selectively disclosed · atomically settled</span>
        </footer>
      </div>
    </div>
  );
}
