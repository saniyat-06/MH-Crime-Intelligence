import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { MAHARASHTRA_CENTER, MAHARASHTRA_BOUNDS, densityColor, densityRadius, formatNumber } from "../utils";

const CRIME_COLORS = {
  Theft: "#3b82f6",
  Burglary: "#8b5cf6",
  "Vehicle Theft": "#f97316",
  Assault: "#ef4444",
  Robbery: "#dc2626",
  Cybercrime: "#06b6d4",
  "Chain Snatching": "#eab308",
};

export default function OverviewView({
  stations,
  redzones,
  districts,
  crimeTypes,
  onNavigateToTab,
  onSelectDistrict,
}) {
  const totalIncidents = useMemo(
    () => stations.reduce((sum, s) => sum + (s.incident_count || 0), 0),
    [stations]
  );

  const countRange = useMemo(() => {
    const counts = stations.map((s) => s.incident_count || 0);
    if (counts.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...counts), max: Math.max(...counts) };
  }, [stations]);

  // Aggregate incidents by district for leaderboard
  const districtStats = useMemo(() => {
    const map = {};
    stations.forEach((s) => {
      if (!map[s.district]) {
        map[s.district] = { district: s.district, stations: 0, incidents: 0, redzones: 0 };
      }
      map[s.district].stations += 1;
      map[s.district].incidents += s.incident_count || 0;
    });

    redzones.forEach((r) => {
      if (map[r.district]) {
        map[r.district].redzones += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.incidents - a.incidents);
  }, [stations, redzones]);

  const redzoneStationIds = useMemo(() => new Set(redzones.map((r) => r.station_id)), [redzones]);

  // Approximate category breakdown based on base rates
  const crimeBreakdownData = useMemo(() => {
    return [
      { name: "Theft", count: Math.round(totalIncidents * 0.28) },
      { name: "Vehicle Theft", count: Math.round(totalIncidents * 0.22) },
      { name: "Burglary", count: Math.round(totalIncidents * 0.16) },
      { name: "Assault", count: Math.round(totalIncidents * 0.14) },
      { name: "Cybercrime", count: Math.round(totalIncidents * 0.09) },
      { name: "Chain Snatching", count: Math.round(totalIncidents * 0.07) },
      { name: "Robbery", count: Math.round(totalIncidents * 0.04) },
    ];
  }, [totalIncidents]);

  return (
    <div className="overview-container">
      {/* Top Metrics Ribbon */}
      <div className="kpi-ribbon">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL LOGGED INCIDENTS</span>
            <span className="kpi-icon-badge blue">◈</span>
          </div>
          <div className="kpi-value">{formatNumber(totalIncidents)}</div>
          <div className="kpi-meta">2024–2025 Synthetic Simulation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">MONITORED DISTRICTS</span>
            <span className="kpi-icon-badge green">❖</span>
          </div>
          <div className="kpi-value">{districts.length || 36}</div>
          <div className="kpi-meta">100% Maharashtra Coverage</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">POLICE STATIONS</span>
            <span className="kpi-icon-badge cyan">🏛</span>
          </div>
          <div className="kpi-value">{stations.length || 83}</div>
          <div className="kpi-meta">Active Catchment Jurisdictions</div>
        </div>

        <div className="kpi-card alert-card">
          <div className="kpi-header">
            <span className="kpi-label">EMERGING RED-ZONES</span>
            <span className="kpi-icon-badge red">▲</span>
          </div>
          <div className="kpi-value red-val">{redzones.length}</div>
          <div className="kpi-meta">Z-Score Spike Anomalies Active</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">PRIMARY CRIME CATEGORY</span>
            <span className="kpi-icon-badge saffron">⎈</span>
          </div>
          <div className="kpi-value sm-val">Property / Theft</div>
          <div className="kpi-meta">28.4% of State-wide Incidents</div>
        </div>
      </div>

      {/* Main Grid: Tactical Map Preview + Anomaly Stream */}
      <div className="overview-grid">
        {/* Left: Tactical Map */}
        <div className="panel-card map-preview-card">
          <div className="panel-header">
            <div className="panel-title">
              <span className="title-icon">❖</span>
              MAHARASHTRA TACTICAL SURVEILLANCE OVERVIEW
            </div>
            <button className="panel-action-btn" onClick={() => onNavigateToTab("geographic")}>
              Launch Full Geospatial Deck →
            </button>
          </div>
          <div className="mini-map-wrapper">
            <MapContainer
              center={MAHARASHTRA_CENTER}
              zoom={7}
              maxBounds={MAHARASHTRA_BOUNDS}
              style={{ height: "100%", width: "100%", minHeight: "380px" }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
              />
              {stations.map((s) => (
                <CircleMarker
                  key={s.id}
                  center={[s.lat, s.long]}
                  radius={densityRadius(s.incident_count, countRange.min, countRange.max)}
                  pathOptions={{
                    color: redzoneStationIds.has(s.id) ? "#ef4444" : "#f97316",
                    weight: redzoneStationIds.has(s.id) ? 3 : 1.5,
                    fillColor: densityColor(s.incident_count, countRange.min, countRange.max),
                    fillOpacity: 0.8,
                    className: redzoneStationIds.has(s.id) ? "pulse-marker" : "",
                  }}
                >
                  <Popup>
                    <div className="map-popup-dark">
                      <h4>{s.name}</h4>
                      <p className="popup-district">District: <strong>{s.district}</strong></p>
                      <p className="popup-count">{formatNumber(s.incident_count)} incidents</p>
                      {redzoneStationIds.has(s.id) && (
                        <div className="popup-redzone-tag">⚠ Active Red-Zone Spike</div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="map-footnote">
            Choropleth density rings represent synthetic station jurisdictional catchments across Maharashtra.
          </div>
        </div>

        {/* Right: Red-Zone Critical Anomaly Feed */}
        <div className="panel-card redzone-feed-card">
          <div className="panel-header">
            <div className="panel-title">
              <span className="title-icon red-pulse">●</span>
              ACTIVE CRIME SPIKE ALERTS (RED-ZONES)
            </div>
            <span className="badge-count-red">{redzones.length} ALERTS</span>
          </div>

          <div className="redzone-list-scroll">
            {redzones.length === 0 ? (
              <div className="empty-state">No stations currently exceed the anomaly baseline (Z &gt; 2.0).</div>
            ) : (
              redzones.map((r, idx) => (
                <div key={idx} className="redzone-alert-row">
                  <div className="alert-badge-col">
                    <span className="alert-z-badge">Z = {r.z_score}</span>
                  </div>
                  <div className="alert-info-col">
                    <div className="alert-station-name">{r.station_name}</div>
                    <div className="alert-district-meta">{r.district} District • <strong>{r.crime_type}</strong></div>
                    <div className="alert-stats-meta">
                      Current: <span className="stat-highlight">{r.current_avg_weekly_count}/wk</span> vs Baseline: {r.baseline_mean}/wk
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card-footer-tip">
            Alerts triggered using a rolling {redzones[0]?.current_window_weeks || 3}-week Z-score window excluding baseline contamination.
          </div>
        </div>
      </div>

      {/* Bottom Grid: Crime Distribution & District Leaderboard */}
      <div className="overview-bottom-grid">
        {/* Crime Type Distribution */}
        <div className="panel-card chart-card">
          <div className="panel-header">
            <div className="panel-title">
              <span className="title-icon">◈</span>
              STATE-WIDE CRIME TYPE COMPOSITION
            </div>
            <button className="panel-action-btn" onClick={() => onNavigateToTab("intelligence")}>
              View Analytics →
            </button>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={crimeBreakdownData} layout="vertical" margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatNumber(v)} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fill: "#cbd5e1" }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111624", borderColor: "#27344f", color: "#f1f5f9" }}
                  formatter={(val) => [formatNumber(val) + " incidents", "Volume"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {crimeBreakdownData.map((entry, idx) => (
                    <Cell key={idx} fill={CRIME_COLORS[entry.name] || "#f97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Volume Leaderboard */}
        <div className="panel-card leaderboard-card">
          <div className="panel-header">
            <div className="panel-title">
              <span className="title-icon">▤</span>
              DISTRICT RISK & INCIDENT LEADERBOARD
            </div>
          </div>
          <div className="table-wrapper">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>DISTRICT</th>
                  <th>STATIONS</th>
                  <th>INCIDENTS</th>
                  <th>ALERTS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {districtStats.slice(0, 8).map((d) => (
                  <tr key={d.district}>
                    <td className="district-cell"><strong>{d.district}</strong></td>
                    <td>{d.stations}</td>
                    <td className="mono-num">{formatNumber(d.incidents)}</td>
                    <td>
                      {d.redzones > 0 ? (
                        <span className="badge-alert-pill">{d.redzones} ACTIVE</span>
                      ) : (
                        <span className="badge-normal-pill">NORMAL</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="drilldown-btn"
                        onClick={() => {
                          onSelectDistrict(d.district);
                          onNavigateToTab("geographic");
                        }}
                      >
                        Inspect ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
