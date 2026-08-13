import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import AuthBrandPanel from "./AuthBrandPanel";
import "./Auth.css";

const roles = [
  {
    value: "donor",
    label: "Donor",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      </svg>
    ),
  },
  {
    value: "recipient_org",
    label: "Organization",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 9h1M14 9h1M9 13h1M14 13h1" />
      </svg>
    ),
  },
  {
    value: "volunteer",
    label: "Volunteer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21c-4.97-3.5-9-7-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4-4.03 7.5-9 11z" />
      </svg>
    ),
  },
];

const orgTypes = [
  { value: "ngo", label: "NGO" },
  { value: "orphanage", label: "Orphanage" },
  { value: "old_age_home", label: "Old-Age Home" },
  { value: "community_shelter", label: "Community Shelter" },
];
const donorTypes = [
  { value: "individual", label: "Individual" },
  { value: "small_business", label: "Small Business" },
];
const volunteerSkills = [
  "Driving",
  "Loading & Unloading",
  "Inventory Handling",
  "Logistics & Delivery",
  "First Aid",
  "Community Support",
];
const donationCategories = ["Food", "Clothes", "Books"];

const registrationPlaceholders = {
  ngo: "NGO Registration Number (Trust/Societies Act)",
  orphanage: "Orphanage License Number (Juvenile Justice Act)",
  old_age_home: "Old-Age Home Registration Number",
  government_school: "UDISE Code",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const today = new Date();
const maxDob = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate(),
)
  .toISOString()
  .split("T")[0];
const minDob = new Date(
  today.getFullYear() - 100,
  today.getMonth(),
  today.getDate(),
)
  .toISOString()
  .split("T")[0];

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "donor",
    address: "",
    donorType: "individual",
    preferredCategories: [],
    orgName: "",
    orgType: "ngo",
    registrationNumber: "",
    dob: "",

    skills: [],

    agreedToTerms: false,
    latitude: null,
    longitude: null,
  });
  const [verificationFile, setVerificationFile] = useState(null);
  const [volunteerIdFile, setVolunteerIdFile] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const navigate = useNavigate();

  const formDataRef = useRef(formData);
  useEffect(() => {
    if (formData.role !== "donor") {
      const container = document.getElementById("googleSignUpButton");

      if (container) container.innerHTML = "";

      return;
    }
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      try {
        setError("");
        const res = await API.post("/auth/google", {
          idToken: response.credential,
          ...formDataRef.current,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (
          res.data.user.role === "recipient_org" ||
          res.data.user.role === "volunteer"
        ) {
          setSubmitStatus("pending_approval");
        } else {
          setSubmitStatus("success");
          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Google sign-up failed");
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
      const container = document.getElementById("googleSignUpButton");
      if (isUnconfigured) {
        if (container) {
          container.innerHTML = `
            <div style="font-size: 0.78rem; color: #5b6461; text-align: center; padding: 10px 14px; background: #f5f6f4; border-radius: 9px; border: 1px dashed #c3c8be; line-height: 1.4;">
              ⚠️ <strong>Google Sign-In setup required</strong><br/>Add your <code>REACT_APP_GOOGLE_CLIENT_ID</code> to <code>frontend/.env</code>
            </div>
          `;
        }
        return;
      }

      try {
        window.google?.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        if (container) {
          container.innerHTML = "";
          window.google?.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: "320",
            text: "signup_with",
            shape: "rectangular",
          });
        }
      } catch (e) {
        console.error("Google Auth init error:", e);
      }
    };

    if (window.google?.accounts?.id) {
      initButton();
    } else {
      script.onload = initButton;
    }
  }, [navigate, formData.role]);
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckbox = (e) =>
    setFormData({ ...formData, agreedToTerms: e.target.checked });

  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const has = prev.preferredCategories.includes(cat);
      return {
        ...prev,
        preferredCategories: has
          ? prev.preferredCategories.filter((c) => c !== cat)
          : [...prev.preferredCategories, cat],
      };
    });
  };
  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);

      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF verification documents are allowed.");
      e.target.value = "";
      return;
    }

    setError("");
    setVerificationFile(file);
  };
  const handleVolunteerIdChange = (e) => setVolunteerIdFile(e.target.files[0]);
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setFormData({ ...formData, phone: digitsOnly });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role,
      latitude: null,
      longitude: null,
      address: "",
    });
    setLocationStatus("idle");
    setLocationName("");
    setVerificationFile(null);
    setVolunteerIdFile(null);
    setSubmitStatus("idle");
    setError("");
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log("Latitude:", lat);
        console.log("Longitude:", lon);
        console.log("Accuracy:", position.coords.accuracy);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            {
              headers: { "User-Agent": "ReliefSphere/1.0" },
            },
          );

          const data = await res.json();

          const placeName = data.display_name || "Location detected";

          setLocationName(placeName);

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            address: placeName,
          }));
        } catch {
          setLocationName("Location detected (name lookup failed)");

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));
        }

        setLocationStatus("done");
      },
      (error) => {
        console.log(error);
        setLocationStatus("error");
      },
    );
  };
  const validateForm = () => {
    const { role } = formData;
    if (role !== "recipient_org" && !formData.fullName.trim())
      return "Full Name is required";
    if (role === "recipient_org" && !formData.orgName.trim())
      return "Organization Name is required";
    if (!formData.email.trim()) return "Email Address is required";
    if (!EMAIL_REGEX.test(formData.email.trim()))
      return "Enter a valid email address";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (!formData.confirmPassword) return "Please confirm your password";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (!formData.phone.trim()) return "Phone Number is required";
    if (!PHONE_REGEX.test(formData.phone.trim()))
      return "Phone Number must be exactly 10 digits";

    if (role === "donor") {
      if (formData.preferredCategories.length === 0)
        return "Select at least one preferred donation category";
      if (locationStatus !== "done") return "Please detect your location";
      if (!formData.address.trim())
        return "Location/address could not be determined — try detecting location again";
    }

    if (role === "recipient_org") {
      if (!formData.registrationNumber.trim())
        return "Registration Number is required";
      if (!verificationFile) return "Verification Document is required";
      if (locationStatus !== "done") return "Please detect your location";
      if (!formData.address.trim())
        return "Location/address could not be determined — try detecting location again";
    }

    if (role === "volunteer") {
      if (formData.skills.length === 0)
        return "Please select at least one skill";
      if (!formData.dob) return "Date of Birth is required";
      const age = Math.floor(
        (new Date() - new Date(formData.dob)) / (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age < 18)
        return "You must be at least 18 years old to register as a volunteer";
      if (!volunteerIdFile) return "Government ID document is required";
      if (locationStatus !== "done") return "Please detect your location";
      if (!formData.address.trim())
        return "Location/address could not be determined — try detecting location again";
    }

    if (!formData.agreedToTerms)
      return "You must agree to the Terms & Conditions";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      let res;
      if (formData.role === "recipient_org" || formData.role === "volunteer") {
        const payload = new FormData();
        Object.entries(formData).forEach(([key, val]) => {
          if (key === "preferredCategories") return;

          if (key === "skills") {
            payload.append("skills", JSON.stringify(val));
            return;
          }

          payload.append(key, val);
        });
        if (formData.role === "recipient_org" && verificationFile)
          payload.append("verificationDoc", verificationFile);
        if (formData.role === "volunteer" && volunteerIdFile)
          payload.append("idDocument", volunteerIdFile);
        res = await API.post("/auth/signup", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await API.post("/auth/signup", formData);
      }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (formData.role === "recipient_org" || formData.role === "volunteer") {
        setSubmitStatus("pending_approval");
      } else {
        setSubmitStatus("success");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  if (submitStatus === "pending_approval") {
    return (
      <div className="auth-container">
        <AuthBrandPanel />
        <div className="auth-right auth-right--centered">
          <div className="auth-right-inner">
            <div className="auth-form-card">
              <h2>Account created ✓</h2>
              <p className="subtitle">
                Your{" "}
                {formData.role === "recipient_org"
                  ? "organization"
                  : "volunteer"}{" "}
                account has been created and is now{" "}
                <strong>pending admin approval</strong>.
              </p>
              <p className="subtitle">
                You'll receive an email at <strong>{formData.email}</strong>{" "}
                once your account is verified. You can log in anytime, but some
                actions will stay locked until approval is complete.
              </p>
              <a
                href="/"
                className="submit-btn"
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitStatus === "success") {
    return (
      <div className="auth-container">
        <AuthBrandPanel />
        <div className="auth-right auth-right--centered">
          <div className="auth-right-inner">
            <div className="auth-form-card">
              <h2>Account created successfully! ✓</h2>
              <p className="subtitle">
                Welcome to ReliefSphere AI! Redirecting to home...
              </p>
              <Link
                to="/"
                className="submit-btn"
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <AuthBrandPanel />

      <div className="auth-right">
        <div className="auth-right-inner">
          <div className="auth-form-card">
            <h2>Create an account</h2>
            <p className="subtitle">
              Join ReliefSphere to start donating or requesting help.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="role-grid">
                {roles.map((r) => (
                  <div
                    key={r.value}
                    className={`role-card ${formData.role === r.value ? "active" : ""}`}
                    onClick={() => handleRoleSelect(r.value)}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>

              <div className="section-head">
                <span className="section-badge">1</span>Account details
              </div>

              {formData.role === "donor" && (
                <div className="form-group">
                  <label>Donor Type</label>
                  <select
                    name="donorType"
                    value={formData.donorType}
                    onChange={handleChange}
                  >
                    {donorTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === "recipient_org" && (
                <>
                  <div className="field-grid">
                    <div className="form-group">
                      <label>Organization Type</label>
                      <select
                        name="orgType"
                        value={formData.orgType}
                        onChange={handleChange}
                      >
                        {orgTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Registration Number</label>
                      <input
                        name="registrationNumber"
                        placeholder={registrationPlaceholders[formData.orgType]}
                        value={formData.registrationNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Organization Name</label>
                    <input
                      name="orgName"
                      placeholder="Your organization's name"
                      value={formData.orgName}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              {formData.role !== "recipient_org" && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    name="fullName"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="field-grid">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit contact number"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {formData.role === "donor" && (
                <>
                  <div className="section-head">
                    <span className="section-badge">2</span>Donation preferences
                  </div>
                  <div className="form-group">
                    <label>Preferred Donation Categories</label>
                    <div className="role-grid">
                      {donationCategories.map((cat) => (
                        <div
                          key={cat}
                          className={`role-card ${formData.preferredCategories.includes(cat) ? "active" : ""}`}
                          onClick={() => toggleCategory(cat)}
                        >
                          <span>{cat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <button
                      type="button"
                      className="location-btn"
                      onClick={detectLocation}
                    >
                      📍 Detect My Location
                    </button>
                    {locationStatus === "detecting" && (
                      <p className="location-hint">Detecting location…</p>
                    )}
                    {locationStatus === "done" && (
                      <p className="location-hint success">
                        Location detected ✓
                      </p>
                    )}
                    {locationStatus === "error" && (
                      <p className="location-hint error">
                        Couldn't detect location — check browser permissions
                      </p>
                    )}
                  </div>
                  {locationStatus === "done" && (
                    <div className="form-group">
                      <label>Location</label>
                      <input value={locationName} readOnly />
                    </div>
                  )}
                </>
              )}

              {formData.role === "recipient_org" && (
                <>
                  <div className="section-head">
                    <span className="section-badge">2</span>Verification
                  </div>
                  <div className="form-group">
                    <label>Registration Certificate (PDF only)</label>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="form-group">
                    <button
                      type="button"
                      className="location-btn"
                      onClick={detectLocation}
                    >
                      📍 Detect My Location
                    </button>
                    {locationStatus === "detecting" && (
                      <p className="location-hint">Detecting location…</p>
                    )}
                    {locationStatus === "done" && (
                      <p className="location-hint success">
                        Location detected ✓
                      </p>
                    )}
                    {locationStatus === "error" && (
                      <p className="location-hint error">
                        Couldn't detect location — check browser permissions
                      </p>
                    )}
                  </div>
                  {locationStatus === "done" && (
                    <div className="form-group">
                      <label>Location</label>
                      <input value={locationName} readOnly />
                    </div>
                  )}
                </>
              )}

              {formData.role === "volunteer" && (
                <>
                  <div className="section-head">
                    <span className="section-badge">2</span>Verification
                  </div>
                  <div className="form-group">
                    <div className="form-group"></div>

                    <div className="form-group">
                      <label>Volunteer Skills</label>

                      <div className="role-grid">
                        {volunteerSkills.map((skill) => (
                          <div
                            key={skill}
                            className={`role-card ${
                              formData.skills.includes(skill) ? "active" : ""
                            }`}
                            onClick={() => toggleSkill(skill)}
                          >
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <label>Date of Birth</label>
                    <input
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      max={maxDob}
                      min={minDob}
                    />
                  </div>
                  <div className="form-group">
                    <label>Government ID (Aadhar / College ID / License)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleVolunteerIdChange}
                    />
                    {verificationFile && (
                      <p
                        style={{
                          color: "#16a34a",
                          fontSize: "14px",
                          marginTop: "8px",
                        }}
                      >
                        ✓ {verificationFile.name}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <button
                      type="button"
                      className="location-btn"
                      onClick={detectLocation}
                    >
                      📍 Detect My Location
                    </button>
                    {locationStatus === "detecting" && (
                      <p className="location-hint">Detecting location…</p>
                    )}
                    {locationStatus === "done" && (
                      <p className="location-hint success">
                        Location detected ✓
                      </p>
                    )}
                    {locationStatus === "error" && (
                      <p className="location-hint error">
                        Couldn't detect location — check browser permissions
                      </p>
                    )}
                  </div>
                  {locationStatus === "done" && (
                    <div className="form-group">
                      <label>Location</label>
                      <input value={locationName} readOnly />
                    </div>
                  )}
                  <p className="location-hint">
                    Your account will be reviewed before you can accept
                    deliveries.
                  </p>
                </>
              )}

              <div className="form-group terms-group">
                <label className="terms-label">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={handleCheckbox}
                  />
                  <span>
                    &nbsp; &nbsp; I agree to the Terms &amp; Conditions and
                    Privacy Policy
                  </span>
                </label>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="submit-btn">
                Sign Up
              </button>
            </form>

            {formData.role === "donor" && (
              <>
                <div className="or-divider">
                  <span>or continue with</span>
                </div>

                <div className="google-btn-wrapper">
                  <div id="googleSignUpButton"></div>
                </div>
              </>
            )}
            {formData.role === "donor" ? (
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
                Secure Google Sign-In for donors
              </div>
            ) : (
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
                Verification documents are required for approval
              </div>
            )}

            <p className="switch-auth">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
