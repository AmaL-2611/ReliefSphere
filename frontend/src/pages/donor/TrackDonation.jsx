import { useState } from "react";

const SAMPLE_DONATIONS = [
  { id: 1, name: "Food Package", type: "Food" },
  { id: 2, name: "Books Bundle", type: "Books" },
  { id: 3, name: "Clothes Pack", type: "Clothes" },
  { id: 4, name: "Grocery Kit", type: "Food" },
];

const TRACKING_DATA = {
  1: {
    stages: [
      { label: "Donation Created", date: "Aug 10, 2026 · 9:00 AM", completed: true, active: false },
      { label: "NGO Accepted", date: "Aug 11, 2026 · 11:30 AM", completed: false, active: true },
      { label: "Volunteer Assigned", date: null, completed: false, active: false },
      { label: "Picked Up", date: null, completed: false, active: false },
      { label: "Delivered", date: null, completed: false, active: false },
    ],
    status: "Accepted",
    organization: "HelpHands Kerala",
    volunteer: "Assigned soon",
  },
  2: {
    stages: [
      { label: "Donation Created", date: "Aug 8, 2026 · 10:00 AM", completed: true, active: false },
      { label: "NGO Accepted", date: "Aug 8, 2026 · 2:00 PM", completed: true, active: false },
      { label: "Volunteer Assigned", date: "Aug 9, 2026 · 9:00 AM", completed: true, active: false },
      { label: "Picked Up", date: "Aug 9, 2026 · 3:00 PM", completed: true, active: false },
      { label: "Delivered", date: null, completed: false, active: true },
    ],
    status: "In Transit",
    organization: "BookBridge NGO",
    volunteer: "Ravi Kumar",
  },
  3: {
    stages: [
      { label: "Donation Created", date: "Aug 5, 2026 · 8:00 AM", completed: true, active: false },
      { label: "NGO Accepted", date: "Aug 5, 2026 · 1:00 PM", completed: true, active: false },
      { label: "Volunteer Assigned", date: "Aug 6, 2026 · 10:00 AM", completed: true, active: false },
      { label: "Picked Up", date: "Aug 6, 2026 · 4:00 PM", completed: true, active: false },
      { label: "Delivered", date: "Aug 7, 2026 · 11:00 AM", completed: true, active: false },
    ],
    status: "Delivered",
    organization: "WarmHands Foundation",
    volunteer: "Priya Nair",
  },
  4: {
    stages: [
      { label: "Donation Created", date: "Aug 12, 2026 · 7:30 AM", completed: true, active: false },
      { label: "NGO Accepted", date: null, completed: false, active: false },
      { label: "Volunteer Assigned", date: null, completed: false, active: false },
      { label: "Picked Up", date: null, completed: false, active: false },
      { label: "Delivered", date: null, completed: false, active: false },
    ],
    status: "Pending",
    organization: "Awaiting NGO",
    volunteer: "Not yet assigned",
  },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <polyline points="12 8 12 12 14 14" />
    </svg>
  );
}

export default function TrackDonation() {
  const [selected, setSelected] = useState(1);
  const trackData = TRACKING_DATA[selected];
  const donation = SAMPLE_DONATIONS.find((d) => d.id === selected);

  const completedCount = trackData.stages.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / trackData.stages.length) * 100);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Track Donation</h1>
        <p className="page-subtitle">Follow your donation's journey from creation to delivery in real time.</p>
      </div>

      {/* Select Donation */}
      <div className="track-select-wrap">
        <label htmlFor="track-select">Select Donation to Track</label>
        <select
          className="form-control"
          id="track-select"
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          style={{ maxWidth: 360 }}
        >
          {SAMPLE_DONATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.type})
            </option>
          ))}
        </select>
      </div>

      <div className="track-container">
        {/* Timeline */}
        <div className="timeline-card">
          <div className="timeline-header">
            <h3>📍 Tracking: {donation?.name}</h3>
            <p>
              Current Status:{" "}
              <span
                style={{
                  color: trackData.status === "Delivered" ? "#16a34a"
                    : trackData.status === "Pending" ? "#ea580c"
                    : "#2563eb",
                  fontWeight: 600,
                }}
              >
                {trackData.status}
              </span>
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
              <span>Progress</span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>{progressPct}%</span>
            </div>
            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                  borderRadius: 999,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline">
            {trackData.stages.map((stage, idx) => (
              <div key={idx} className="timeline-step">
                <div
                  className={`timeline-dot ${
                    stage.completed ? "completed" : stage.active ? "active" : "pending"
                  }`}
                >
                  {stage.completed && <CheckIcon />}
                  {stage.active && (
                    <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }} />
                  )}
                  {!stage.completed && !stage.active && <ClockIcon />}
                </div>
                <div className={`timeline-step-title${!stage.completed && !stage.active ? " pending-step" : ""}`}>
                  {stage.label}
                </div>
                {stage.date ? (
                  <div className="timeline-step-date">🕐 {stage.date}</div>
                ) : (
                  <div className="timeline-step-date" style={{ fontStyle: "italic" }}>
                    Awaiting…
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div>
          <div className="timeline-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
              🏢 Organization Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>NGO / Organization</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{trackData.organization}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Volunteer</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{trackData.volunteer}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Donation Type</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{donation?.type}</span>
              </div>
            </div>
          </div>

          {/* Stage Legend */}
          <div className="timeline-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>
              📖 Stage Legend
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { dot: "completed", text: "Completed", color: "#10b981", bg: "#d1fae5" },
                { dot: "active", text: "In Progress", color: "#059669", bg: "#a7f3d0" },
                { dot: "pending", text: "Pending", color: "#94a3b8", bg: "#f1f5f9" },
              ].map((l) => (
                <div key={l.dot} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: l.bg, border: `2px solid ${l.color}`,
                  }} />
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
