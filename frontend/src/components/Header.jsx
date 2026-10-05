import { useState, useEffect } from "react";

export default function Header({ activeTab, setActiveTab, role, setRole, assignedDistrict }) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) + " • " +
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "overview", label: "Command Overview", icon: "⎈" },
    { id: "intelligence", label: "Crime Intelligence", icon: "◈" },
    { id: "geographic", label: "Geographic Analysis", icon: "❖" },
    { id: "risk", label: "Risk & Prediction", icon: "▲" },
    { id: "network", label: "Criminal Network", icon: "☊" },
    { id: "reports", label: "Intelligence Reports", icon: "▤" },
  ];

  return (
    <header className="ops-header">
      <div className="header-top-bar">
        <div className="header-brand">
          <div className="emblem-container">
            <span className="emblem-symbol">🏛</span>
          </div>
          <div className="brand-titles">
            <div className="brand-main-title">
              MAHARASHTRA CRIME INTELLIGENCE & ANALYTICS
              <span className="brand-badge">MAHACRIME-INTEL</span>
            </div>
            <div className="brand-sub-title">
              State Police Operations & Anomaly Detection Center • Analytical Surveillance
            </div>
          </div>
        </div>

        <div className="header-meta">
          <div className="synthetic-data-pill" title="This platform runs on realistic synthetic crime data generated for demonstration">
            <span className="pill-dot"></span>
            SYNTHETIC DEMO DATASET
          </div>

          <div className="live-status-pill">
            <span className="status-indicator-live"></span>
            <span className="status-text">LIVE NODE: CONNECTED</span>
          </div>

          <div className="header-clock">
            <span className="clock-icon">⏱</span>
            <span className="clock-time">{currentTime}</span>
          </div>

          <div className="role-selector-box">
            <div className="role-label">OPERATOR PROFILE</div>
            <div className="role-btn-group">
              <button
                className={`role-btn ${role === "analyst" ? "active" : ""}`}
                onClick={() => setRole("analyst")}
                title="Full state-wide access across all 36 districts"
              >
                🔍 State Analyst
              </button>
              <button
                className={`role-btn ${role === "officer" ? "active" : ""}`}
                onClick={() => setRole("officer")}
                title={`Restricted to assigned district (${assignedDistrict})`}
              >
                👮 Station Officer
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className="header-nav-bar">
        <div className="nav-tab-list">
          {navItems.map((item) => {
            const isRestricted = role === "officer" && (item.id === "network" || item.id === "risk");
            return (
              <button
                key={item.id}
                className={`nav-tab-btn ${activeTab === item.id ? "active" : ""} ${isRestricted ? "disabled" : ""}`}
                disabled={isRestricted}
                onClick={() => !isRestricted && setActiveTab(item.id)}
                title={isRestricted ? "Restricted: State Analyst clearance required" : item.label}
              >
                <span className="nav-tab-icon">{isRestricted ? "🔒" : item.icon}</span>
                <span className="nav-tab-label">{item.label}</span>
                {item.id === "risk" && <span className="nav-badge ml-badge">ML</span>}
                {item.id === "network" && <span className="nav-badge network-badge">GRAPH</span>}
              </button>
            );
          })}
        </div>

        {role === "officer" && (
          <div className="officer-jurisdiction-alert">
            <span className="lock-icon">🔒</span>
            <span>RESTRICTED VIEW: JURISDICTION LOCKED TO <strong>{assignedDistrict.toUpperCase()}</strong></span>
          </div>
        )}
      </nav>
    </header>
  );
}
