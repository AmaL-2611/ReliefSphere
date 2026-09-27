import { useState, useEffect } from "react";
import API from "../../api/axios";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("geolocation");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [settings, setSettings] = useState({
    matchingRules: {
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
      platformName: "ReliefSphere",
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
            matchingRules: { ...prev.matchingRules, ...res.data.settings.matchingRules },
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
    try {
      setSaving(true);
      const res = await API.put("/admin/settings", settings);
      if (res.data.success) {
        showToast("System configuration saved successfully! ✓", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      matchingRules: {
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
        platformName: "ReliefSphere",
        supportEmail: "support@reliefsphere.org",
        maintenanceMode: false,
      },
    });
    showToast("Reset to default configuration (Click Save to apply)", "info");
  };

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
            System Configuration & Platform Settings
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Configure spatial distance radiuses, notification channels, and platform settings.
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
