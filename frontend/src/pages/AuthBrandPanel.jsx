import "./Auth.css";

export default function AuthBrandPanel() {
  return (
    <div className="auth-left">
      <div className="auth-overlay"></div>

      <div className="auth-left-inner">
        {/* Logo */}

        <div className="hero-top">
          <div className="brand-logo">
            <div className="logo-circle">❤</div>

            <div>
              <h2>ReliefSphere </h2>
              <span>Smart Humanitarian Platform</span>
            </div>
          </div>

          <div className="hero-text">
            <h1>
              Donate
              <br />
              Smarter.
            </h1>

            <h1 className="hero-second">Reach Faster.</h1>

            <p>
              ReliefSphere AI intelligently connects verified donors,
              organizations and volunteers to ensure every donation reaches
              those who need it most.
            </p>
          </div>
        </div>

        {/* Workflow */}

        <div className="workflow-card">
          <h3>How it works</h3>

          <div className="workflow">
            <div className="workflow-item">
              <div className="workflow-icon">📦</div>
              <span>Create Donation</span>
            </div>

            <div className="workflow-line"></div>

            <div className="workflow-item">
              <div className="workflow-icon">🤖</div>
              <span>AI Matching</span>
            </div>

            <div className="workflow-line"></div>

            <div className="workflow-item">
              <div className="workflow-icon">🏢</div>
              <span>Nearest NGO</span>
            </div>

            <div className="workflow-line"></div>

            <div className="workflow-item">
              <div className="workflow-icon">🚚</div>
              <span>Volunteer Delivery</span>
            </div>

            <div className="workflow-line"></div>

            <div className="workflow-item">
              <div className="workflow-icon">❤</div>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        {/* Feature cards */}

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡</div>

            <div>
              <h4>Verified Organizations</h4>

              <p>
                Every NGO and volunteer is reviewed before joining the platform.
              </p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>

            <div>
              <h4>AI Recommendations</h4>

              <p>Intelligent donation matching using location and urgency.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📍</div>

            <div>
              <h4>Live Tracking</h4>

              <p>Follow every donation until it reaches its destination.</p>
            </div>
          </div>
        </div>

        {/* Statistics */}

        <div className="modern-stats">
          <div className="modern-stat">
            <h2>320+</h2>
            <span>Registered Donors</span>
          </div>

          <div className="modern-stat">
            <h2>56</h2>
            <span>Verified NGOs</span>
          </div>

          <div className="modern-stat">
            <h2>185</h2>
            <span>Active Volunteers</span>
          </div>

          <div className="modern-stat">
            <h2>98%</h2>
            <span>Successful Deliveries</span>
          </div>
        </div>
      </div>

      <div className="auth-footer">
        © 2026 ReliefSphere • Built with AI for Social Good
      </div>
    </div>
  );
}
