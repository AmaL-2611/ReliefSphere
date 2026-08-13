import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaHeartPulse,
  FaHandHoldingHeart,
  FaTruckFast,
  FaUsers,
  FaShieldHalved,
  FaArrowRight,
  FaCheck,
  FaChevronDown,
  FaBars,
  FaXmark,
  FaCircleCheck,
  FaBrain,
  FaBoxOpen,
  FaChartPie,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaLocationDot,
  FaBolt,
  FaBuildingNgo
} from "react-icons/fa6";
import { HiSparkles, HiShieldCheck } from "react-icons/hi2";
import backgroundImg from "../images/background.png";
import "./LandingPage.css";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("donor");
  const [openFaq, setOpenFaq] = useState(null);
  const profileRef = useRef(null);

  // Scroll listener for sticky glass header
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector(".navbar");
      if (header) {
        if (window.scrollY > 30) {
          header.classList.add("navbar-scrolled");
        } else {
          header.classList.remove("navbar-scrolled");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const closeMenu = (e) => {
      if (
        menuOpen &&
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [menuOpen]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      q: "How does the AI Matching Algorithm work?",
      a: "ReliefSphere AI evaluates urgency metrics, perishability, geographical distance, real-time NGO capacity, and historical demand to pair donors with the most effective nearby NGO instantly."
    },
    {
      q: "How are NGOs and Organizations verified?",
      a: "Every organization undergoes strict document verification, government registration checks, and on-ground audits before receiving verified status on the platform."
    },
    {
      q: "Can donors track their supplies in real-time?",
      a: "Yes! Every single donation is assigned a unique digital tracking ID. Donors receive real-time GPS updates from volunteer pickup through to proof-of-delivery confirmation."
    },
    {
      q: "How do volunteers receive delivery tasks?",
      a: "Volunteers set their location and availability in the mobile app. The AI system assigns optimal pickup and dropoff routes based on proximity and vehicle capacity."
    },
    {
      q: "Is ReliefSphere free for non-profit organizations?",
      a: "Yes! ReliefSphere is 100% free for non-profit organizations, accredited charities, and community aid volunteers to maximize relief distribution."
    }
  ];

  return (
    <div className="landing">
      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <FaHeartPulse />
          </div>
          <div className="logo-text">
            <h2>ReliefSphere</h2>
            <span>Smart Humanitarian Platform</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <a href="#home">Home</a>
          <a href="#workflow">How It Works</a>
          <a href="#preview">Live Platform</a>
          <a href="#features">Features</a>
          <a href="#portals">Portals</a>
          <a href="#faq">FAQ</a>
        </nav>

        {/* Action Buttons & Profile Dropdown */}
        <div className="header-actions">
          <Link to="/login" className="login-link">
            Log In
          </Link>
          <Link to="/signup" className="register-btn">
            Get Started
          </Link>

          <div className="profile-wrapper" ref={profileRef}>
            <button
              className="profile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Account Menu"
              aria-label="User Account Menu"
            >
              <FaUsers />
            </button>

            {menuOpen && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <p>Welcome to ReliefSphere</p>
                  <span>Select Portal</span>
                </div>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Login to Portal
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>
                  Register New Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileNavOpen ? <FaXmark /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="mobile-nav-drawer">
            <a href="#home" onClick={() => setMobileNavOpen(false)}>
              Home
            </a>
            <a href="#workflow" onClick={() => setMobileNavOpen(false)}>
              How It Works
            </a>
            <a href="#preview" onClick={() => setMobileNavOpen(false)}>
              Live Platform
            </a>
            <a href="#features" onClick={() => setMobileNavOpen(false)}>
              Features
            </a>
            <a href="#portals" onClick={() => setMobileNavOpen(false)}>
              Portals
            </a>
            <a href="#faq" onClick={() => setMobileNavOpen(false)}>
              FAQ
            </a>
            <div className="mobile-drawer-buttons">
              <Link
                to="/login"
                className="mobile-btn-login"
                onClick={() => setMobileNavOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="mobile-btn-register"
                onClick={() => setMobileNavOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION ================= */}
      <section id="home" className="hero">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <HiSparkles className="badge-icon" />
            <span>AI-Powered Relief Ecosystem</span>
          </div>

          <h1>
            Transforming <span>Surplus Resources</span> Into Lifesaving Impact
          </h1>

          <p>
            ReliefSphere AI dynamically connects donors, verified NGOs, and
            active volunteers through automated matching, real-time logistics
            tracking, and transparent proof-of-delivery.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="primary-btn">
              <span>Start Donating</span>
              <FaArrowRight className="btn-icon" />
            </Link>

            <Link to="/signup" className="secondary-btn">
              <span>Register Organization</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-box">
              <h2>25,000+</h2>
              <p>Relief Packs Delivered</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <h2>350+</h2>
              <p>Verified NGO Partners</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <h2>98.4%</h2>
              <p>AI Match Accuracy</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-image-wrapper">
            <img src={backgroundImg} alt="Relief Distribution" className="hero-image" />
            <div className="image-overlay-gradient"></div>

            {/* Floating Live AI Card */}
            <div className="floating-card top-card">
              <div className="card-icon ai-icon">
                <FaBrain />
              </div>
              <div className="card-info">
                <div className="card-tag">AI Optimal Match</div>
                <h4>Food Donation → Hope Foundation</h4>
                <p>Proximity: 2.4 km • High Urgency</p>
              </div>
            </div>

            {/* Floating Trust Verification Card */}
            <div className="floating-card bottom-card">
              <div className="trust-badge-circle">
                <HiShieldCheck />
              </div>
              <div className="card-info">
                <h4>99.8% Trust Score</h4>
                <span>100% Verified NGO Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WORKFLOW SECTION ================= */}
      <section className="workflow-section" id="workflow">
        <div className="section-title">
          <span className="section-badge">
            <FaBolt /> HOW IT WORKS
          </span>
          <h2>Intelligent AI Resource Pipeline</h2>
          <p>
            Every donation follows an automated end-to-end process to ensure maximum speed, transparency, and accountability.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="step-num">01</div>
            <div className="workflow-icon-box">
              <FaBoxOpen />
            </div>
            <h3>1. Create Donation</h3>
            <p>Donors list surplus food, medicine, books, or essential supplies via the portal.</p>
          </div>

          <div className="workflow-connector">
            <FaArrowRight />
          </div>

          <div className="workflow-card">
            <div className="step-num">02</div>
            <div className="workflow-icon-box ai-step">
              <FaBrain />
            </div>
            <h3>2. AI Analysis & Match</h3>
            <p>Algorithms assess perishability, location, emergency severity, and NGO demand.</p>
          </div>

          <div className="workflow-connector">
            <FaArrowRight />
          </div>

          <div className="workflow-card">
            <div className="step-num">03</div>
            <div className="workflow-icon-box">
              <FaShieldHalved />
            </div>
            <h3>3. NGO Acceptance</h3>
            <p>Verified regional organizations review and accept matched relief requests automatically.</p>
          </div>

          <div className="workflow-connector">
            <FaArrowRight />
          </div>

          <div className="workflow-card">
            <div className="step-num">04</div>
            <div className="workflow-icon-box">
              <FaTruckFast />
            </div>
            <h3>4. Smart Dispatch</h3>
            <p>Nearby volunteers receive route guidance and pickup notifications in real time.</p>
          </div>

          <div className="workflow-connector">
            <FaArrowRight />
          </div>

          <div className="workflow-card">
            <div className="step-num">05</div>
            <div className="workflow-icon-box success-step">
              <FaHandHoldingHeart />
            </div>
            <h3>5. Direct Impact</h3>
            <p>Supplies reach beneficiaries with complete tracking records and digital proof of delivery.</p>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE LIVE DASHBOARD PREVIEW ================= */}
      <section className="dashboard-preview" id="preview">
        <div className="section-title">
          <span className="section-badge">
            <FaChartPie /> LIVE PLATFORM PREVIEW
          </span>
          <h2>Unified Visibility for Every Stakeholder</h2>
          <p>
            Experience how ReliefSphere provides real-time tracking, AI matching, and analytics tailored to your role.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === "donor" ? "active" : ""}`}
            onClick={() => setActiveTab("donor")}
          >
            <FaHandHoldingHeart /> Donor Portal
          </button>
          <button
            className={`tab-btn ${activeTab === "ngo" ? "active" : ""}`}
            onClick={() => setActiveTab("ngo")}
          >
            <FaBuildingNgo /> Organization Hub
          </button>
          <button
            className={`tab-btn ${activeTab === "volunteer" ? "active" : ""}`}
            onClick={() => setActiveTab("volunteer")}
          >
            <FaTruckFast /> Volunteer Portal
          </button>
          <button
            className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <FaShieldHalved /> Admin Control
          </button>
        </div>

        {/* Mock SaaS Dashboard Frame */}
        <div className="dashboard-frame">
          <div className="window-header">
            <div className="window-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="window-title">
              reliefsphere.app/portal/
              <span className="highlight-path">{activeTab}</span>
            </div>
            <div className="window-status">
              <span className="pulse-dot-sm"></span> System Online
            </div>
          </div>

          <div className="dashboard-body">
            {/* Sidebar */}
            <div className="frame-sidebar">
              <div className="sidebar-brand">
                <FaHeartPulse /> ReliefSphere
              </div>
              <div className="sidebar-menu">
                <div className="sidebar-item active">Overview</div>
                <div className="sidebar-item">Active Orders</div>
                <div className="sidebar-item">AI Match Feed</div>
                <div className="sidebar-item">Logistics Map</div>
                <div className="sidebar-item">Impact Reports</div>
                <div className="sidebar-item">Settings</div>
              </div>
            </div>

            {/* Dashboard Main Content area based on activeTab */}
            <div className="frame-main">
              {activeTab === "donor" && (
                <div className="preview-view">
                  <div className="view-header">
                    <div>
                      <h3>Donor Portal Overview</h3>
                      <p>Track your active contributions and live AI matches.</p>
                    </div>
                    <Link to="/signup" className="mini-cta">
                      + Create New Donation
                    </Link>
                  </div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Total Contributions</span>
                      <h3>42 Packs</h3>
                      <div className="trend positive">+12% this month</div>
                    </div>
                    <div className="metric-card">
                      <span>People Impacted</span>
                      <h3>186 Individuals</h3>
                      <div className="trend positive">Direct Beneficiaries</div>
                    </div>
                    <div className="metric-card">
                      <span>Active Delivery</span>
                      <h3>1 In-Transit</h3>
                      <div className="trend neutral">Driver Assigned</div>
                    </div>
                    <div className="metric-card">
                      <span>Carbon Saved</span>
                      <h3>128 kg CO₂</h3>
                      <div className="trend positive">Food Waste Reduced</div>
                    </div>
                  </div>

                  <div className="dashboard-charts-row">
                    <div className="chart-box">
                      <h4>Monthly Donation Volume</h4>
                      <div className="bar-chart-mock">
                        <div className="bar-col"><div className="bar" style={{ height: "40%" }}></div><span>Jan</span></div>
                        <div className="bar-col"><div className="bar" style={{ height: "65%" }}></div><span>Feb</span></div>
                        <div className="bar-col"><div className="bar" style={{ height: "50%" }}></div><span>Mar</span></div>
                        <div className="bar-col"><div className="bar" style={{ height: "85%" }}></div><span>Apr</span></div>
                        <div className="bar-col"><div className="bar active-bar" style={{ height: "95%" }}></div><span>May</span></div>
                      </div>
                    </div>
                    <div className="feed-box">
                      <h4>Recent Activity</h4>
                      <ul className="activity-list">
                        <li>
                          <FaCircleCheck className="icon-green" />
                          <div>
                            <strong>50 Meals Delivered</strong>
                            <span>Matched to Sunshine Shelter • 12 mins ago</span>
                          </div>
                        </li>
                        <li>
                          <FaTruckFast className="icon-blue" />
                          <div>
                            <strong>Driver Picked Up Package</strong>
                            <span>Volunteer Alex K. in transit</span>
                          </div>
                        </li>
                        <li>
                          <FaBrain className="icon-purple" />
                          <div>
                            <strong>AI Match Found</strong>
                            <span>Medicines matched to Red Cross Regional</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ngo" && (
                <div className="preview-view">
                  <div className="view-header">
                    <div>
                      <h3>Organization Inventory & Requests</h3>
                      <p>Manage incoming AI-matched allocations and volunteer dispatch.</p>
                    </div>
                    <span className="status-pill green-pill">Verified NGO</span>
                  </div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Incoming Shipments</span>
                      <h3>8 Requests</h3>
                      <div className="trend positive">Ready for Acceptance</div>
                    </div>
                    <div className="metric-card">
                      <span>Fulfilled Relief</span>
                      <h3>1,240 kg</h3>
                      <div className="trend positive">Distributed this week</div>
                    </div>
                    <div className="metric-card">
                      <span>Trust Rating</span>
                      <h3>99.4%</h3>
                      <div className="trend positive">Verified Audit</div>
                    </div>
                    <div className="metric-card">
                      <span>Active Volunteers</span>
                      <h3>24 Nearby</h3>
                      <div className="trend neutral">Available Now</div>
                    </div>
                  </div>

                  <div className="dashboard-charts-row">
                    <div className="chart-box">
                      <h4>Allocated Relief Supply Breakdown</h4>
                      <div className="pie-legend-mock">
                        <div className="legend-item"><span className="dot-color c1"></span> Prepared Food (45%)</div>
                        <div className="legend-item"><span className="dot-color c2"></span> Dry Rations (30%)</div>
                        <div className="legend-item"><span className="dot-color c3"></span> Medical Supplies (15%)</div>
                        <div className="legend-item"><span className="dot-color c4"></span> Clothing & Shelter (10%)</div>
                      </div>
                    </div>
                    <div className="feed-box">
                      <h4>Pending Acceptances</h4>
                      <ul className="activity-list">
                        <li>
                          <FaBoxOpen className="icon-orange" />
                          <div>
                            <strong>200 kg Grains & Rice</strong>
                            <span>Donor: Metro Logistics Center</span>
                          </div>
                        </li>
                        <li>
                          <FaBoxOpen className="icon-orange" />
                          <div>
                            <strong>50 Emergency First Aid Kits</strong>
                            <span>Donor: Global Health Corp</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "volunteer" && (
                <div className="preview-view">
                  <div className="view-header">
                    <div>
                      <h3>Volunteer Dispatch Console</h3>
                      <p>View proximity-based delivery tasks and route navigation.</p>
                    </div>
                    <span className="status-pill blue-pill">Driver Active</span>
                  </div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Assigned Pickups</span>
                      <h3>2 Pending</h3>
                      <div className="trend positive">Within 3.5 km</div>
                    </div>
                    <div className="metric-card">
                      <span>Completed Deliveries</span>
                      <h3>64 Orders</h3>
                      <div className="trend positive">Total Impact Score</div>
                    </div>
                    <div className="metric-card">
                      <span>Hours Contributed</span>
                      <h3>48 Hours</h3>
                      <div className="trend neutral">Community Rank: Gold</div>
                    </div>
                    <div className="metric-card">
                      <span>Rating</span>
                      <h3>4.9 / 5.0</h3>
                      <div className="trend positive">Based on 52 reviews</div>
                    </div>
                  </div>

                  <div className="dashboard-charts-row">
                    <div className="chart-box">
                      <h4>Live Optimized Delivery Route</h4>
                      <div className="route-mock-box">
                        <div className="route-step start">
                          <FaLocationDot /> Pickup: Metro Supermarket (1.2 km away)
                        </div>
                        <div className="route-line"></div>
                        <div className="route-step end">
                          <FaHandHoldingHeart /> Dropoff: Hope Community Kitchen
                        </div>
                      </div>
                    </div>
                    <div className="feed-box">
                      <h4>Nearby Task Radar</h4>
                      <ul className="activity-list">
                        <li>
                          <FaTruckFast className="icon-blue" />
                          <div>
                            <strong>Food Surplus Pickup</strong>
                            <span>Est time: 14 mins • 2.1 km</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "admin" && (
                <div className="preview-view">
                  <div className="view-header">
                    <div>
                      <h3>Global Command Center</h3>
                      <p>Platform wide resource orchestration, verification & analytics.</p>
                    </div>
                    <span className="status-pill purple-pill">Full Admin Access</span>
                  </div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Total Relief Value</span>
                      <h3>$1.42 M</h3>
                      <div className="trend positive">+28% growth</div>
                    </div>
                    <div className="metric-card">
                      <span>Network Organizations</span>
                      <h3>352 NGOs</h3>
                      <div className="trend positive">100% Audited</div>
                    </div>
                    <div className="metric-card">
                      <span>Active Volunteers</span>
                      <h3>1,420 Active</h3>
                      <div className="trend positive">Global Operations</div>
                    </div>
                    <div className="metric-card">
                      <span>Avg Delivery Time</span>
                      <h3>28 Mins</h3>
                      <div className="trend positive">3x Faster than average</div>
                    </div>
                  </div>

                  <div className="dashboard-charts-row">
                    <div className="chart-box">
                      <h4>Systemwide AI Efficiency Index</h4>
                      <div className="bar-chart-mock">
                        <div className="bar-col"><div className="bar" style={{ height: "70%" }}></div><span>W1</span></div>
                        <div className="bar-col"><div className="bar" style={{ height: "80%" }}></div><span>W2</span></div>
                        <div className="bar-col"><div className="bar" style={{ height: "88%" }}></div><span>W3</span></div>
                        <div className="bar-col"><div className="bar active-bar" style={{ height: "98%" }}></div><span>W4</span></div>
                      </div>
                    </div>
                    <div className="feed-box">
                      <h4>Security & Audit Feed</h4>
                      <ul className="activity-list">
                        <li>
                          <FaShieldHalved className="icon-purple" />
                          <div>
                            <strong>NGO Document Verified</strong>
                            <span>Care Relief Int. approved</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="features-section" id="features">
        <div className="section-title">
          <span className="section-badge">
            <HiSparkles /> PLATFORM FEATURES
          </span>
          <h2>Engineered for Maximum Humanitarian Efficiency</h2>
          <p>
            ReliefSphere combines cutting-edge AI, logistics automation, and security to transform how aid is delivered.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper color-1">
              <FaBrain />
            </div>
            <div className="feature-tag">AI Precision</div>
            <h3>Smart Match Recommendation</h3>
            <p>
              Instantly matches donations with nearby accredited organizations based on urgency, shelf-life, and storage capacity.
            </p>
            <ul className="feature-list">
              <li><FaCheck /> Real-time urgency ranking</li>
              <li><FaCheck /> Zero food waste optimization</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper color-2">
              <FaTruckFast />
            </div>
            <div className="feature-tag">Live Logistics</div>
            <h3>GPS Route Optimization</h3>
            <p>
              Provides volunteers with automated turn-by-turn route suggestions to speed up pickups and drop-offs.
            </p>
            <ul className="feature-list">
              <li><FaCheck /> Proximity dispatch</li>
              <li><FaCheck /> Live map telemetry</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper color-3">
              <FaShieldHalved />
            </div>
            <div className="feature-tag">Trust & Security</div>
            <h3>Verified Organization Vetting</h3>
            <p>
              Multi-step compliance checks ensure every receiving organization is genuine and fully audited.
            </p>
            <ul className="feature-list">
              <li><FaCheck /> Automated document verification</li>
              <li><FaCheck /> Transparency logs</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper color-4">
              <FaChartPie />
            </div>
            <div className="feature-tag">Analytics</div>
            <h3>Impact Analytics & Reports</h3>
            <p>
              Donors and corporate partners get transparent reporting on meals served, lives impacted, and carbon footprint reduction.
            </p>
            <ul className="feature-list">
              <li><FaCheck /> Automated tax receipts</li>
              <li><FaCheck /> Custom ESG dashboards</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper color-5">
              <FaUsers />
            </div>
            <div className="feature-tag">Community Network</div>
            <h3>Volunteer Reward Ecosystem</h3>
            <p>
              Recognizes volunteer contributions with community badges, impact points, and verified certificate digital credentials.
            </p>
            <ul className="feature-list">
              <li><FaCheck /> Verified hours log</li>
              <li><FaCheck /> Recognition badges</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper color-6">
              <FaBolt />
            </div>
            <div className="feature-tag">Emergency Surge</div>
            <h3>Crisis Rapid Response</h3>
            <p>
              Instantly activates emergency broadcasting and surge logistics during natural disasters or urgent relief crises.
            </p>
            <ul className="feature-list">
              <li><FaCheck /> Crisis alert mode</li>
              <li><FaCheck /> Bulk resource pooling</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= USER PORTALS SECTION ================= */}
      <section className="portal-section" id="portals">
        <div className="section-title">
          <span className="section-badge">USER PORTALS</span>
          <h2>Tailored Workspaces for Every Participant</h2>
          <p>Whether you're donating excess inventory, running an NGO, or volunteering, we have a workspace built for you.</p>
        </div>

        <div className="portal-grid">
          <div className="portal-card donor-portal">
            <div className="portal-badge">FOR DONORS</div>
            <div className="portal-header-icon">
              <FaHandHoldingHeart />
            </div>
            <h3>Donor Portal</h3>
            <p>Easily post excess food, supplies, or financial aid and watch your contribution make a direct impact.</p>
            <ul>
              <li><FaCheck /> Quick 1-Minute Donation Listing</li>
              <li><FaCheck /> AI Match Recommendations</li>
              <li><FaCheck /> Real-Time Live Delivery Map</li>
              <li><FaCheck /> Automated ESG Tax Certificates</li>
            </ul>
            <Link to="/signup" className="portal-btn">
              Join as Donor <FaArrowRight />
            </Link>
          </div>

          <div className="portal-card ngo-portal">
            <div className="portal-badge">FOR ORGANIZATIONS</div>
            <div className="portal-header-icon">
              <FaBuildingNgo />
            </div>
            <h3>Organization Hub</h3>
            <p>Receive pre-vetted donation matches, manage local inventory, and request emergency supplies seamlessly.</p>
            <ul>
              <li><FaCheck /> Automated AI Match Alerts</li>
              <li><FaCheck /> Inventory & Distribution Control</li>
              <li><FaCheck /> Direct Volunteer Dispatching</li>
              <li><FaCheck /> Verified Audit Credentials</li>
            </ul>
            <Link to="/signup" className="portal-btn">
              Register Organization <FaArrowRight />
            </Link>
          </div>

          <div className="portal-card volunteer-portal">
            <div className="portal-badge">FOR VOLUNTEERS</div>
            <div className="portal-header-icon">
              <FaTruckFast />
            </div>
            <h3>Volunteer Portal</h3>
            <p>Pick up and deliver supplies in your area with turn-by-turn navigation and earn verified impact points.</p>
            <ul>
              <li><FaCheck /> Proximity-Based Pickup Radar</li>
              <li><FaCheck /> In-App Smart Route Navigation</li>
              <li><FaCheck /> Flexible Schedule Control</li>
              <li><FaCheck /> Community Recognition Badges</li>
            </ul>
            <Link to="/signup" className="portal-btn">
              Become a Volunteer <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="faq-section" id="faq">
        <div className="section-title">
          <span className="section-badge">FAQ</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about the ReliefSphere platform and operations.</p>
        </div>

        <div className="faq-container">
          {faqData.map((item, idx) => (
            <div
              key={idx}
              className={`faq-item ${openFaq === idx ? "open" : ""}`}
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question">
                <h4>{item.q}</h4>
                <div className="faq-icon">
                  <FaChevronDown />
                </div>
              </div>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="cta-banner">
        <div className="cta-content">
          <span className="cta-badge">JOIN THE ECOSYSTEM TODAY</span>
          <h2>Ready to Revolutionize Humanitarian Aid?</h2>
          <p>
            Join thousands of donors, verified non-profits, and volunteers making a measurable difference every single day.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-btn-primary">
              Get Started Now <FaArrowRight />
            </Link>
            <Link to="/login" className="cta-btn-secondary">
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <FaHeartPulse className="footer-logo-icon" />
              <span>ReliefSphere</span>
            </div>
            <p>
              Smart Humanitarian AI Ecosystem transforming surplus resources into immediate lifesaving support through transparency and technology.
            </p>
            <div className="footer-contact-info">
              <div><FaPhone /> 24/7 Crisis Dispatch: +1 (800) 555-RELIEF</div>
              <div><FaEnvelope /> support@reliefsphere.org</div>
              <div><FaGlobe /> Worldwide Operations</div>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Navigation</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#workflow">How It Works</a></li>
              <li><a href="#preview">Live Platform</a></li>
              <li><a href="#features">Platform Features</a></li>
              <li><a href="#portals">User Portals</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portals & Login</h4>
            <ul>
              <li><Link to="/login">Donor Portal Login</Link></li>
              <li><Link to="/login">Organization Hub Login</Link></li>
              <li><Link to="/login">Volunteer Portal Login</Link></li>
              <li><Link to="/signup">Register New Account</Link></li>
              <li><Link to="/forgot-password">Reset Password</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Safety & Compliance</h4>
            <ul>
              <li><a href="#faq">NGO Verification Standard</a></li>
              <li><a href="#faq">AI Matching Whitepaper</a></li>
              <li><a href="#faq">Food Safety Protocol</a></li>
              <li><a href="#faq">Privacy Policy</a></li>
              <li><a href="#faq">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ReliefSphere Platform. All rights reserved.</p>
          <div className="footer-badge-row">
            <span className="footer-pill"><HiShieldCheck /> 100% Verified Non-Profit Network</span>
            <span className="footer-pill"><FaBrain /> AI-Optimized Logistics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
