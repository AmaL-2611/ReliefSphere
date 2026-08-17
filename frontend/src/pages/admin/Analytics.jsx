import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import API from "../../api/axios";

const MONTHLY_DATA = [
  { month: "Jan", donations: 42, requirements: 38, delivered: 35 },
  { month: "Feb", donations: 58, requirements: 50, delivered: 48 },
  { month: "Mar", donations: 65, requirements: 60, delivered: 59 },
  { month: "Apr", donations: 80, requirements: 72, delivered: 75 },
  { month: "May", donations: 95, requirements: 88, delivered: 90 },
  { month: "Jun", donations: 110, requirements: 102, delivered: 105 },
];

const CATEGORY_DATA = [
  { name: "Food", value: 45, color: "#10b981" },
  { name: "Clothes", value: 25, color: "#0891b2" },
  { name: "Books", value: 15, color: "#6366f1" },
  { name: "Medicine", value: 10, color: "#ef4444" },
  { name: "Essentials", value: 5, color: "#f59e0b" },
];

const SUCCESS_RATE_DATA = [
  { week: "Week 1", rate: 85 },
  { week: "Week 2", rate: 89 },
  { week: "Week 3", rate: 92 },
  { week: "Week 4", rate: 96 },
];

export default function Analytics() {
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Platform Impact & Analytics</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Comprehensive data visualization of resource redistribution efficiency, NGO fulfillment, and delivery success.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Resource Impact</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#10b981", marginTop: 4 }}>450+ Units</div>
          <div style={{ fontSize: 12, color: "#059669", marginTop: 4, fontWeight: 600 }}>↑ 24% from last month</div>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>AI Match Accuracy</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0891b2", marginTop: 4 }}>91.4%</div>
          <div style={{ fontSize: 12, color: "#0891b2", marginTop: 4, fontWeight: 600 }}>Weighted multi-factor score</div>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Delivery Fulfillment Rate</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#6366f1", marginTop: 4 }}>96.0%</div>
          <div style={{ fontSize: 12, color: "#4f46e5", marginTop: 4, fontWeight: 600 }}>Proof verified deliveries</div>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Verified NGO Network</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>18 NGOs</div>
          <div style={{ fontSize: 12, color: "#d97706", marginTop: 4, fontWeight: 600 }}>Active orphanages & shelters</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Monthly Bar Chart */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>
            Monthly Resource Distribution Trend
          </h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="donations" fill="#10b981" radius={[6, 6, 0, 0]} name="Donations Created" />
                <Bar dataKey="delivered" fill="#0891b2" radius={[6, 6, 0, 0]} name="Successfully Delivered" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>
            Category Distribution
          </h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 10 }}>
            {CATEGORY_DATA.map((c) => (
              <span key={c.name} style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
                {c.name} ({c.value}%)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Success Rate Area Chart */}
      <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>
          Weekly Delivery Success Rate (%)
        </h3>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={SUCCESS_RATE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis domain={[70, 100]} stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="rate" stroke="#6366f1" fill="#e0e7ff" strokeWidth={3} name="Success Rate %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
