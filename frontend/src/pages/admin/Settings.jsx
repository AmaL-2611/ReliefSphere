import { useState, useEffect } from "react";
import API from "../../api/axios";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("ai");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [settings, setSettings] = useState({
    aiWeights: {
      categoryMatch: 40,
      quantityRatio: 25,
      urgency: 20,
      proximity: 15,
      minMatchThreshold: 40,
    },
    distanceThresholds: {
      localKm: 5,
      districtKm: 20,
      regionalKm: 50,
      maxRadiusKm: 100,
    },
    notifications: {
      emailEnabled: true,
      smsAlertsEnabled: false,
      autoAssignVolunteer: true,
    },
    system: {
      platformName: "ReliefSphere AI",
      supportEmail: "support@reliefsphere.org",
      maintenanceMode: false,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await API.get("/admin/settings");
        if (res.data.success && res.data.settings) {
          setSettings((prev) => ({
            aiWeights: { ...prev.aiWeights, ...res.data.settings.aiWeights },
            distanceThresholds: {
              ...prev.distanceThresholds,
              ...res.data.settings.distanceThresholds,
            },
            notifications: {
              ...prev.notifications,
              ...res.data.settings.notifications,
            },
            system: { ...prev.system, ...res.data.settings.system },
          }));
        }
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);


  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleAiWeightChange = (key, value) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setSettings((prev) => ({
      ...prev,
      aiWeights: { ...prev.aiWeights, [key]: num },
    }));
  };

  const handleDistanceChange = (key, value) => {
    const num = Math.max(1, Math.min(500, Number(value) || 1));
    setSettings((prev) => ({
      ...prev,
      distanceThresholds: { ...prev.distanceThresholds, [key]: num },
    }));
  };

  const handleNotificationToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleSystemChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      system: { ...prev.system, [key]: value },
    }));
  };

  const handleSave = async () => {
    const { categoryMatch, quantityRatio, urgency, proximity } = settings.aiWeights;
    const totalWeights = categoryMatch + quantityRatio + urgency + proximity;

    if (totalWeights !== 100) {
      showToast(`Total AI Factor Weights must sum to 100 (Currently ${totalWeights} pts)`, "error");
      return;
    }

    try {
      setSaving(true);
      const res = await API.put("/admin/settings", settings);
      if (res.data.success) {
        showToast("System configuration saved & live AI engine updated! ✓", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      aiWeights: {
        categoryMatch: 40,
        quantityRatio: 25,
        urgency: 20,
        proximity: 15,
        minMatchThreshold: 40,
      },
      distanceThresholds: {
        localKm: 5,
        districtKm: 20,
        regionalKm: 50,
        maxRadiusKm: 100,
      },
      notifications: {
        emailEnabled: true,
        smsAlertsEnabled: false,
        autoAssignVolunteer: true,
      },
      system: {
        platformName: "ReliefSphere AI",
        supportEmail: "support@reliefsphere.org",
        maintenanceMode: false,
      },
    });
    showToast("Reset to default configuration (Click Save to apply)", "info");
  };

  const totalWeight =
    settings.aiWeights.categoryMatch +
    settings.aiWeights.quantityRatio +
    settings.aiWeights.urgency +
    settings.aiWeights.proximity;

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading System Settings…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0", maxWidth: 1100 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            System Configuration & AI Engine Settings
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Configure live AI decision factors, spatial distance radiuses, notification channels, and platform settings.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleResetDefaults}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              border: "none",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 14,
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
            }}
          >
            {saving ? "Saving Changes…" : "Save Configuration ✓"}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast.show && (
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            marginBottom: 20,
            color: "white",
            fontWeight: 600,
            fontSize: 14,
            background:
              toast.type === "error"
                ? "#ef4444"
                : toast.type === "info"
                ? "#0284c7"
                : "#10b981",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {toast.type === "error" ? "⚠️" : "✓"} {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: 24,
          gap: 8,
          overflowX: "auto",
        }}
      >
        {[
          { id: "ai", label: "🤖 AI Matcher Engine", icon: "🧠" },
          { id: "geolocation", label: "📍 Geolocation & Radiuses", icon: "🗺️" },
          { id: "notifications", label: "🔔 Notifications & Logistics", icon: "📱" },
          { id: "system", label: "⚙️ Platform Preferences", icon: "🔧" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              background: "none",
              borderBottom: activeTab === t.id ? "3px solid #10b981" : "3px solid transparent",
              color: activeTab === t.id ? "#10b981" : "#64748b",
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: AI MATCHING ENGINE */}
      {activeTab === "ai" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Total Weight Status Card */}
          <div
            style={{
              background: totalWeight === 100 ? "#ecfdf5" : "#fef2f2",
              border: `1.5px solid ${totalWeight === 100 ? "#6ee7b7" : "#fca5a5"}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: totalWeight === 100 ? "#065f46" : "#991b1b",
                }}
              >
                {totalWeight === 100
                  ? "✓ 100-Point Scoring Algorithm Balanced"
                  : `⚠️ Weight Sum Misalignment (${totalWeight} / 100 pts)`}
              </div>
              <div style={{ fontSize: 13, color: totalWeight === 100 ? "#047857" : "#b91c1c", marginTop: 2 }}>
                {totalWeight === 100
                  ? "The 4-factor multi-criteria algorithm is mathematically balanced."
                  : "The sum of Category, Quantity, Urgency, and Distance weights must equal exactly 100 points."}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: totalWeight === 100 ? "#10b981" : "#ef4444" }}>
              {totalWeight} / 100 pts
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {/* Factor 1 */}
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <label style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                  🏷️ Category Match (S_category)
                </label>
                <span style={{ fontWeight: 800, color: "#10b981" }}>
                  {settings.aiWeights.categoryMatch} pts
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.aiWeights.categoryMatch}
                onChange={(e) => handleAiWeightChange("categoryMatch", e.target.value)}
                style={{ width: "100%", accentColor: "#10b981" }}
              />
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                Strict KNN category classification bonus when donation item matches required item type.
              </p>
            </div>

            {/* Factor 2 */}
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <label style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                  📦 Quantity Ratio (S_quantity)
                </label>
                <span style={{ fontWeight: 800, color: "#3b82f6" }}>
                  {settings.aiWeights.quantityRatio} pts
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.aiWeights.quantityRatio}
                onChange={(e) => handleAiWeightChange("quantityRatio", e.target.value)}
                style={{ width: "100%", accentColor: "#3b82f6" }}
              />
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                Constraint satisfaction weight based on Q_donated / Q_required ratio fulfillment.
              </p>
            </div>

            {/* Factor 3 */}
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <label style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                  🚨 Urgency Priority (S_urgency)
                </label>
                <span style={{ fontWeight: 800, color: "#f59e0b" }}>
                  {settings.aiWeights.urgency} pts
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.aiWeights.urgency}
                onChange={(e) => handleAiWeightChange("urgency", e.target.value)}
                style={{ width: "100%", accentColor: "#f59e0b" }}
              />
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                Earliest Deadline First (EDF) multiplier for Critical & High urgency requests.
              </p>
            </div>

            {/* Factor 4 */}
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <label style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                  📍 Proximity Distance (S_distance)
                </label>
                <span style={{ fontWeight: 800, color: "#8b5cf6" }}>
                  {settings.aiWeights.proximity} pts
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.aiWeights.proximity}
                onChange={(e) => handleAiWeightChange("proximity", e.target.value)}
                style={{ width: "100%", accentColor: "#8b5cf6" }}
              />
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                Haversine spatial distance score multiplier prioritizing close geographical donors.
              </p>
            </div>
          </div>


          {/* Minimum Threshold Card */}
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <label style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
                  🎯 Minimum Recommendation Threshold
                </label>
                <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
                  Only matches scoring above this threshold will trigger automatic donor recommendations.
                </p>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                {settings.aiWeights.minMatchThreshold} pts
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={settings.aiWeights.minMatchThreshold}
              onChange={(e) => handleAiWeightChange("minMatchThreshold", e.target.value)}
              style={{ width: "100%", accentColor: "#0f172a" }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: GEOLOCATION RADIUSES */}
      {activeTab === "geolocation" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          <div style={{ background: "white", padding: 22, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 8 }}>
              🏘️ Local Neighborhood Radius
            </label>
            <input
              type="number"
              value={settings.distanceThresholds.localKm}
              onChange={(e) => handleDistanceChange("localKm", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 15,
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b", marginTop: 6, display: "block" }}>
              Max pts (100% proximity score) awarded within this range.
            </span>
          </div>

          <div style={{ background: "white", padding: 22, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 8 }}>
              🏙️ District Radius (km)
            </label>
            <input
              type="number"
              value={settings.distanceThresholds.districtKm}
              onChange={(e) => handleDistanceChange("districtKm", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 15,
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b", marginTop: 6, display: "block" }}>
              Medium proximity points (66% score) awarded within this range.
            </span>
          </div>

          <div style={{ background: "white", padding: 22, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 8 }}>
              🗺️ Regional Radius (km)
            </label>
            <input
              type="number"
              value={settings.distanceThresholds.regionalKm}
              onChange={(e) => handleDistanceChange("regionalKm", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 15,
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b", marginTop: 6, display: "block" }}>
              Low proximity points (33% score) awarded within this range.
            </span>
          </div>

          <div style={{ background: "white", padding: 22, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 8 }}>
              🌐 Max Search Radius Limit (km)
            </label>
            <input
              type="number"
              value={settings.distanceThresholds.maxRadiusKm}
              onChange={(e) => handleDistanceChange("maxRadiusKm", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 15,
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b", marginTop: 6, display: "block" }}>
              Upper boundary for Haversine spatial matching queries.
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS & AUTOMATION */}
      {activeTab === "notifications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              key: "emailEnabled",
              title: "📧 Automated Email Notifications",
              desc: "Send instant transactional emails for signup approvals, donation receipts, and delivery updates.",
            },
            {
              key: "smsAlertsEnabled",
              title: "📲 Disaster SMS Emergency Alerts (Twilio/Firebase)",
              desc: "Dispatch emergency SMS notifications to volunteers and recipient orgs in low-connectivity disaster zones.",
            },
            {
              key: "autoAssignVolunteer",
              title: "🚚 Smart Volunteer Dispatch Auto-Flagging",
              desc: "Automatically notify nearest verified volunteers when an organization accepts a donor match.",
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications[item.key]}
                onChange={() => handleNotificationToggle(item.key)}
                style={{
                  width: 22,
                  height: 22,
                  accentColor: "#10b981",
                  cursor: "pointer",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: PLATFORM SYSTEM PREFERENCES */}
      {activeTab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "white", padding: 22, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 8 }}>
              🏷️ Platform Name
            </label>
            <input
              type="text"
              value={settings.system.platformName}
              onChange={(e) => handleSystemChange("platformName", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ background: "white", padding: 22, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 8 }}>
              ✉️ Official Support Email Address
            </label>
            <input
              type="email"
              value={settings.system.supportEmail}
              onChange={(e) => handleSystemChange("supportEmail", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 15,
              }}
            />
          </div>

          <div
            style={{
              background: settings.system.maintenanceMode ? "#fef2f2" : "white",
              padding: 22,
              borderRadius: 14,
              border: `1.5px solid ${settings.system.maintenanceMode ? "#fca5a5" : "#e2e8f0"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: settings.system.maintenanceMode ? "#991b1b" : "#1e293b" }}>
                🚨 System Maintenance Mode
              </div>
              <div style={{ fontSize: 13, color: settings.system.maintenanceMode ? "#b91c1c" : "#64748b", marginTop: 2 }}>
                When enabled, non-admin users will see a maintenance screen.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.system.maintenanceMode}
              onChange={(e) => handleSystemChange("maintenanceMode", e.target.checked)}
              style={{
                width: 22,
                height: 22,
                accentColor: "#ef4444",
                cursor: "pointer",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
