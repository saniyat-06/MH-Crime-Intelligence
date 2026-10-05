import { useState, useMemo } from "react";
import { formatNumber } from "../utils";

export default function ReportsView({ stations, districts, crimeTypes, redzones }) {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const filteredStations = useMemo(() => {
    if (!selectedDistrict) return stations;
    return stations.filter((s) => s.district === selectedDistrict);
  }, [stations, selectedDistrict]);

  const totalIncidents = useMemo(
    () => filteredStations.reduce((sum, s) => sum + (s.incident_count || 0), 0),
    [filteredStations]
  );

  const districtRedzones = useMemo(() => {
    if (!selectedDistrict) return redzones;
    return redzones.filter((r) => r.district === selectedDistrict);
  }, [redzones, selectedDistrict]);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const url = `http://localhost:8000/api/incidents?${selectedDistrict ? `district=${encodeURIComponent(selectedDistrict)}&` : ""}limit=10000`;
      const res = await fetch(url);
      const data = await res.json();
      const incidents = data.incidents || [];

      if (incidents.length === 0) {
        alert("No incidents found for current selection.");
        setExportLoading(false);
        return;
      }

      // Format CSV
      const headers = ["ID", "Station Name", "District", "Latitude", "Longitude", "Crime Type", "Timestamp", "Weapon/Method", "Target Type", "Escape Pattern"];
      const rows = incidents.map((i) => [
        i.id,
        `"${i.station_name}"`,
        `"${i.district}"`,
        i.lat,
        i.long,
        `"${i.crime_type}"`,
        `"${i.timestamp}"`,
        `"${i.weapon_or_method || ''}"`,
        `"${i.target_type || ''}"`,
        `"${i.escape_pattern || ''}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", downloadUrl);
      link.setAttribute(
        "download",
        `MAHACRIME_INTEL_REPORT_${selectedDistrict || "ALL_MAHARASHTRA"}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="reports-view-layout">
      {/* Top Action Bar */}
      <div className="reports-top-bar">
        <div className="reports-filter-box">
          <label>DISTRICT SCOPE:</label>
          <select
            className="ops-select-sm"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="">All 36 Maharashtra Districts (State Executive)</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-actions">
          <button className="ops-btn-primary" onClick={handleExportCSV} disabled={exportLoading}>
            {exportLoading ? "Generating CSV..." : "📥 Export Filtered Dataset (CSV)"}
          </button>
          <button className="ops-btn-secondary" onClick={() => window.print()}>
            🖨 Print Briefing Dossier
          </button>
        </div>
      </div>

      {/* Intelligence Briefing Document */}
      <div className="report-document-sheet">
        <div className="report-header-section">
          <div className="doc-emblem">🏛</div>
          <div className="doc-title-block">
            <h2>MAHARASHTRA STATE CRIME INTELLIGENCE &amp; SURVEILLANCE REPORT</h2>
            <div className="doc-meta-line">
              <span>DOCUMENT CODE: <strong>MCIP-SEC-2026-MHA</strong></span>
              <span>CLASSIFICATION: <strong>OFFICIAL DEMO INTELLIGENCE</strong></span>
              <span>GENERATED: <strong>{new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</strong></span>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="report-summary-ribbon">
          <div className="report-stat-box">
            <span className="lbl">ANALYZED DISTRICT(S)</span>
            <span className="val">{selectedDistrict || "All 36 Districts"}</span>
          </div>
          <div className="report-stat-box">
            <span className="lbl">TOTAL RECORDED INCIDENTS</span>
            <span className="val saffron">{formatNumber(totalIncidents)}</span>
          </div>
          <div className="report-stat-box">
            <span className="lbl">MONITORED POLICE STATIONS</span>
            <span className="val">{filteredStations.length}</span>
          </div>
          <div className="report-stat-box">
            <span className="lbl">ACTIVE RED-ZONE SPIKES</span>
            <span className={`val ${districtRedzones.length > 0 ? "red-text" : "green-text"}`}>
              {districtRedzones.length}
            </span>
          </div>
        </div>

        {/* Briefing Narrative */}
        <div className="report-section">
          <h3 className="section-heading">1. EXECUTIVE CRIME &amp; PATTERN APPRAISAL</h3>
          <p className="doc-paragraph">
            This intelligence summary synthesizes machine learning predictions, geospatial density analysis, and anomaly alerting across <strong>{selectedDistrict || "all 36 administrative districts of Maharashtra"}</strong>. Incident distribution demonstrates standard baseline volumes with pronounced temporal surges in property crime (Theft and Vehicle Theft) during nocturnal hours (22:00–04:59) and weekend spikes in interpersonal offenses (Assault and Chain Snatching).
          </p>
        </div>

        {/* Red-Zone Threat Alert Table */}
        <div className="report-section">
          <h3 className="section-heading">2. EMERGING RED-ZONE ANOMALIES &amp; THREAT STATIONS</h3>
          {districtRedzones.length === 0 ? (
            <p className="doc-paragraph muted">No statistical anomaly alerts detected above threshold (Z &gt; 2.0) in the current operational window.</p>
          ) : (
            <table className="ops-table report-table">
              <thead>
                <tr>
                  <th>STATION NAME</th>
                  <th>DISTRICT</th>
                  <th>CRIME TYPE</th>
                  <th>OBSERVED RATE</th>
                  <th>BASELINE</th>
                  <th>Z-SCORE SPIKE</th>
                </tr>
              </thead>
              <tbody>
                {districtRedzones.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.station_name}</strong></td>
                    <td>{r.district}</td>
                    <td><span className="crime-type-tag">{r.crime_type}</span></td>
                    <td className="mono-num">{r.current_avg_weekly_count}/wk</td>
                    <td className="mono-num">{r.baseline_mean}/wk</td>
                    <td><span className="z-score-tag">Z = {r.z_score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Police Station Jurisdiction Breakdown */}
        <div className="report-section">
          <h3 className="section-heading">3. POLICE STATION CATCHMENT VOLUME MATRIX</h3>
          <table className="ops-table report-table">
            <thead>
              <tr>
                <th>STATION NAME</th>
                <th>DISTRICT</th>
                <th>LATITUDE</th>
                <th>LONGITUDE</th>
                <th>TOTAL INCIDENTS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.slice(0, 15).map((s) => {
                const isRed = redzones.some((r) => r.station_id === s.id);
                return (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.district}</td>
                    <td className="mono-num">{s.lat.toFixed(4)}° N</td>
                    <td className="mono-num">{s.long.toFixed(4)}° E</td>
                    <td className="mono-num">{formatNumber(s.incident_count)}</td>
                    <td>
                      {isRed ? (
                        <span className="badge-alert-pill">ALERT ACTIVE</span>
                      ) : (
                        <span className="badge-normal-pill">NORMAL</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStations.length > 15 && (
            <p className="table-truncated-note">
              Showing top 15 of {filteredStations.length} stations. Use CSV export above for the full dataset.
            </p>
          )}
        </div>

        <div className="report-footer">
          <div className="footer-disclaimer">
            NOTICE: All data in this dossier was generated by the MAHACRIME-INTEL synthetic simulation pipeline for analytical evaluation and decision-support demonstrations.
          </div>
        </div>
      </div>
    </div>
  );
}
