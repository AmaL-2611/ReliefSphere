import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import AuthBrandPanel from "./AuthBrandPanel";
import "./Auth.css";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  // Login Success
  const handleLoginSuccess = useCallback(
    (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccessMsg("Logged in successfully! Redirecting...");

      setTimeout(() => {
        switch (data.user.role) {
          case "admin":
            navigate("/admin");
            break;

          case "donor":
            navigate("/donor-dashboard");
            break;

          case "recipient_org":
            navigate("/organization-dashboard");
            break;

          case "volunteer":
            navigate("/volunteer-dashboard");
            break;

          default:
            navigate("/");
        }
      }, 1200);
    },
    [navigate],
  );

  // Email Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMsg("");

    try {
      const res = await API.post("/auth/login", formData);

      handleLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  // Google Login
  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      try {
        setError("");
        setSuccessMsg("");

        const res = await API.post("/auth/google", {
          idToken: response.credential,
        });

        handleLoginSuccess(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Google sign-in failed");
      }
    };

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const isUnconfigured =
      !clientId ||
      clientId.includes("your-google-client-id") ||
      clientId.includes("YOUR_GOOGLE_CLIENT_ID");

    const initButton = () => {
      const container = document.getElementById("googleSignInButton");

      if (isUnconfigured) {
        if (container) {
          container.innerHTML = `
            <div style="
              font-size:13px;
              color:#666;
              text-align:center;
              padding:10px;
              background:#f5f6f4;
              border-radius:8px;
              border:1px dashed #ccc;
            ">
              Google Sign-In is not configured.
            </div>
          `;
        }
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        if (container) {
          container.innerHTML = "";

          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: "320",
            text: "signin_with",
            shape: "rectangular",
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (window.google?.accounts?.id) {
      initButton();
    } else {
      script.onload = initButton;
    }
  }, [handleLoginSuccess]);

  return (
    <div className="auth-container">
      <AuthBrandPanel />

      <div className="auth-right login-right">
        <div className="auth-right-inner">
          <div className="auth-form-card login-card">
            <h2>Welcome Back</h2>
            <p className="subtitle">
              Please enter your credentials to continue.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Password
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <p className="error-text">{error}</p>}
              {successMsg && (
                <p
                  className="location-hint success"
                  style={{ marginBottom: 12 }}
                >
                  {successMsg}
                </p>
              )}

              <button type="submit" className="submit-btn">
                Sign In
              </button>
            </form>

            <div className="or-divider">
              <span>or continue with</span>
            </div>

            <div className="google-btn-wrapper">
              <div id="googleSignInButton" />
            </div>

            <div className="trust-strip">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Verified donors &amp; organizations only
            </div>

            <p className="switch-auth">
              Don't have an account? <a href="/signup">Create one</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
