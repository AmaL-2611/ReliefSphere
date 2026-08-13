import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import AuthBrandPanel from "./AuthBrandPanel";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <AuthBrandPanel />

      <div className="auth-right auth-right--centered">
        <div className="auth-right-inner">
          <div className="auth-form-card">
            <h2>Forgot Password</h2>
            <p className="subtitle">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-text">{error}</p>}
              {message && (
                <p
                  className="location-hint success"
                  style={{ marginBottom: 12 }}
                >
                  {message}
                </p>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <p className="switch-auth">
              Remembered your password? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
