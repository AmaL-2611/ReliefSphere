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
  community_shelter: "Municipal Permit / Shelter License No. (e.g. CS-2026-1234)",
  government_school: "UDISE Code",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const validateRegistrationNumber = (value, orgType) => {
  const val = (value || "").trim();
  if (!val) return "Registration Number is required";

  if (orgType === "government_school") {
    if (!/^\d{11}$/.test(val)) return "UDISE Code must be an 11-digit number (e.g. 32010100101)";
    return null;
  }

  if (val.length < 6) return "Registration Number must be at least 6 characters";
  if (val.length > 30) return "Registration Number cannot exceed 30 characters";
  if (!/^[A-Za-z0-9/-]+$/.test(val))
    return "Only letters, numbers, slashes (/), and hyphens (-) are allowed";

  const digitCount = (val.match(/\d/g) || []).length;
  if (digitCount < 3) {
    return "Registration Number must contain at least 3 numerical digits";
  }

  const hasDelimiter = /[/|-]/.test(val);
  if (!hasDelimiter && !/^[A-Za-z]{2,4}\d{4,}$/.test(val)) {
    return "Invalid format. Use standard format like KL/2021/0123456 or REG-12345";
  }

  return null;
};


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

  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldValidating, setFieldValidating] = useState({});
  const [fieldSuccess, setFieldSuccess] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const checkTimeoutsRef = useRef({});

  const formDataRef = useRef(formData);
  useEffect(() => {
    if (formData.role !== "donor") {
      const container = document.getElementById("googleSignUpButton");

      if (container) container.innerHTML = "";

      return;
    }
    formDataRef.current = formData;
  }, [formData]);

  const calcPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "#e2e8f0" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    if (pass.length >= 10) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "#ef4444" };
      case 2:
        return { score: 50, label: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 75, label: "Good", color: "#3b82f6" };
      case 4:
        return { score: 100, label: "Strong", color: "#22c55e" };
      default:
        return { score: 15, label: "Too short", color: "#ef4444" };
    }
  };

  const performAjaxCheck = (field, value) => {
    if (checkTimeoutsRef.current[field]) {
      clearTimeout(checkTimeoutsRef.current[field]);
    }
    setFieldValidating((prev) => ({ ...prev, [field]: true }));
    setFieldSuccess((prev) => ({ ...prev, [field]: "" }));

    checkTimeoutsRef.current[field] = setTimeout(async () => {
      try {
        const res = await API.post("/auth/check-availability", {
          field,
          value: value.trim(),
        });
        setFieldValidating((prev) => ({ ...prev, [field]: false }));
        if (!res.data.available) {
          setFieldErrors((prev) => ({ ...prev, [field]: res.data.message }));
          setFieldSuccess((prev) => ({ ...prev, [field]: "" }));
        } else {
          setFieldErrors((prev) => ({ ...prev, [field]: "" }));
          const label =
            field === "email"
              ? "Email address is available"
              : field === "phone"
                ? "Phone number is available"
                : "Registration number is available";
          setFieldSuccess((prev) => ({ ...prev, [field]: label }));
        }
      } catch {
        setFieldValidating((prev) => ({ ...prev, [field]: false }));
      }
    }, 400);
  };

  const validateSingleField = (name, value, currentFormData = formData) => {
    let err = "";
    const role = currentFormData.role;

    if (name === "fullName" && role !== "recipient_org") {
      if (!value.trim()) err = "Full Name is required";
      else if (value.trim().length < 2)
        err = "Full Name must be at least 2 characters";
    }

    if (name === "orgName" && role === "recipient_org") {
      if (!value.trim()) err = "Organization Name is required";
      else if (value.trim().length < 2)
        err = "Organization Name must be at least 2 characters";
    }

    if (name === "email") {
      if (!value.trim()) err = "Email Address is required";
      else if (!EMAIL_REGEX.test(value.trim()))
        err = "Enter a valid email address";
      else performAjaxCheck("email", value);
    }

    if (name === "phone") {
      if (!value.trim()) err = "Phone Number is required";
      else if (!PHONE_REGEX.test(value.trim()))
        err = "Phone Number must be exactly 10 digits";
      else performAjaxCheck("phone", value);
    }

    if (name === "password") {
      if (!value) err = "Password is required";
      else if (value.length < 6)
        err = "Password must be at least 6 characters";
      if (currentFormData.confirmPassword) {
        if (value !== currentFormData.confirmPassword) {
          setFieldErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords do not match",
          }));
        } else {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
      }
    }

    if (name === "confirmPassword") {
      if (!value) err = "Please confirm your password";
      else if (value !== currentFormData.password)
        err = "Passwords do not match";
    }

    if (name === "registrationNumber" && role === "recipient_org") {
      const regErr = validateRegistrationNumber(value, currentFormData.orgType);
      if (regErr) err = regErr;
      else performAjaxCheck("registrationNumber", value);
    }


    if (name === "dob" && role === "volunteer") {
      if (!value) err = "Date of Birth is required";
      else {
        const age = Math.floor(
          (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000),
        );
        if (age < 18)
          err = "You must be at least 18 years old to register as a volunteer";
      }
    }

    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldTouched((prev) => ({ ...prev, [name]: true }));
    validateSingleField(name, value);
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    if (fieldTouched[name]) {
      validateSingleField(name, value, updatedForm);
    }
  };

  const handleCheckbox = (e) => {
    const checked = e.target.checked;
    setFormData({ ...formData, agreedToTerms: checked });
    setFieldTouched((prev) => ({ ...prev, agreedToTerms: true }));
    setFieldErrors((prev) => ({
      ...prev,
      agreedToTerms: checked ? "" : "You must agree to the Terms & Conditions",
    }));
  };

  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const has = prev.preferredCategories.includes(cat);
      const updated = has
        ? prev.preferredCategories.filter((c) => c !== cat)
        : [...prev.preferredCategories, cat];
      setFieldErrors((f) => ({
        ...f,
        preferredCategories:
          updated.length === 0
            ? "Select at least one preferred donation category"
            : "",
      }));
      return { ...prev, preferredCategories: updated };
    });
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      const updated = exists
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      setFieldErrors((f) => ({
        ...f,
        skills: updated.length === 0 ? "Please select at least one skill" : "",
      }));
      return { ...prev, skills: updated };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFieldErrors((f) => ({
        ...f,
        verificationDoc: "Verification Document is required",
      }));
      return;
    }
    if (file.type !== "application/pdf") {
      setFieldErrors((f) => ({
        ...f,
        verificationDoc: "Only PDF verification documents are allowed.",
      }));
      e.target.value = "";
      setVerificationFile(null);
      return;
    }
    setFieldErrors((f) => ({ ...f, verificationDoc: "" }));
    setError("");
    setVerificationFile(file);
  };

  const handleVolunteerIdChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFieldErrors((f) => ({
        ...f,
        volunteerIdFile: "Government ID document is required",
      }));
      return;
    }
    setFieldErrors((f) => ({ ...f, volunteerIdFile: "" }));
    setVolunteerIdFile(file);
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    const updatedForm = { ...formData, phone: digitsOnly };
    setFormData(updatedForm);
    setFieldTouched((prev) => ({ ...prev, phone: true }));
    validateSingleField("phone", digitsOnly, updatedForm);
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
    setFieldErrors({});
    setFieldSuccess({});
    setFieldTouched({});
    setFieldValidating({});
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
        setFieldErrors((f) => ({ ...f, location: "" }));
      },
      (error) => {
        console.log(error);
        setLocationStatus("error");
      },
    );
  };

  const validateForm = () => {
    const { role } = formData;
    const errors = {};

    if (role !== "recipient_org" && !formData.fullName.trim())
      errors.fullName = "Full Name is required";
    if (role === "recipient_org" && !formData.orgName.trim())
      errors.orgName = "Organization Name is required";
    if (!formData.email.trim()) errors.email = "Email Address is required";
    else if (!EMAIL_REGEX.test(formData.email.trim()))
      errors.email = "Enter a valid email address";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!formData.phone.trim()) errors.phone = "Phone Number is required";
    else if (!PHONE_REGEX.test(formData.phone.trim()))
      errors.phone = "Phone Number must be exactly 10 digits";

    if (role === "donor") {
      if (formData.preferredCategories.length === 0)
        errors.preferredCategories =
          "Select at least one preferred donation category";
      if (locationStatus !== "done" || !formData.address.trim())
        errors.location = "Please detect your location";
    }

    if (role === "recipient_org") {
      const regErr = validateRegistrationNumber(formData.registrationNumber, formData.orgType);
      if (regErr) errors.registrationNumber = regErr;
      if (!verificationFile)
        errors.verificationDoc = "Verification Document is required";
      if (locationStatus !== "done" || !formData.address.trim())
        errors.location = "Please detect your location";
    }


    if (role === "volunteer") {
      if (formData.skills.length === 0)
        errors.skills = "Please select at least one skill";
      if (!formData.dob) errors.dob = "Date of Birth is required";
      else {
        const age = Math.floor(
          (new Date() - new Date(formData.dob)) /
            (365.25 * 24 * 60 * 60 * 1000),
        );
        if (age < 18)
          errors.dob =
            "You must be at least 18 years old to register as a volunteer";
      }
      if (!volunteerIdFile)
        errors.volunteerIdFile = "Government ID document is required";
      if (locationStatus !== "done" || !formData.address.trim())
        errors.location = "Please detect your location";
    }

    if (!formData.agreedToTerms)
      errors.agreedToTerms = "You must agree to the Terms & Conditions";

    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {},
    );
    setFieldTouched(allTouched);
    setFieldErrors((prev) => ({ ...prev, ...errors }));

    const hasAnyError =
      Object.values(errors).some(Boolean) ||
      Object.values(fieldErrors).some(Boolean);

    if (hasAnyError) {
      return Object.values(errors).find(Boolean) || "Please fix errors in the form";
    }
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
                        onBlur={handleBlur}
                        className={
                          fieldErrors.registrationNumber
                            ? "input-has-error"
                            : fieldSuccess.registrationNumber
                              ? "input-is-valid"
                              : ""
                        }
                      />
                      {fieldValidating.registrationNumber && (
                        <div className="field-checking-msg">
                          <span className="spinner-mini"></span> Checking registration number...
                        </div>
                      )}
                      {fieldErrors.registrationNumber && (
                        <div className="field-error-msg">
                          ⚠️ {fieldErrors.registrationNumber}
                        </div>
                      )}
                      {fieldSuccess.registrationNumber &&
                        !fieldErrors.registrationNumber &&
                        !fieldValidating.registrationNumber && (
                          <div className="field-success-msg">
                            ✓ {fieldSuccess.registrationNumber}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Organization Name</label>
                    <input
                      name="orgName"
                      placeholder="Your organization's name"
                      value={formData.orgName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        fieldErrors.orgName
                          ? "input-has-error"
                          : fieldTouched.orgName && !fieldErrors.orgName && formData.orgName
                            ? "input-is-valid"
                            : ""
                      }
                    />
                    {fieldErrors.orgName && (
                      <div className="field-error-msg">⚠️ {fieldErrors.orgName}</div>
                    )}
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
                    onBlur={handleBlur}
                    className={
                      fieldErrors.fullName
                        ? "input-has-error"
                        : fieldTouched.fullName && !fieldErrors.fullName && formData.fullName
                          ? "input-is-valid"
                          : ""
                    }
                  />
                  {fieldErrors.fullName && (
                    <div className="field-error-msg">⚠️ {fieldErrors.fullName}</div>
                  )}
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
                    onBlur={handleBlur}
                    className={
                      fieldErrors.email
                        ? "input-has-error"
                        : fieldSuccess.email
                          ? "input-is-valid"
                          : ""
                    }
                  />
                  {fieldValidating.email && (
                    <div className="field-checking-msg">
                      <span className="spinner-mini"></span> Checking email availability...
                    </div>
                  )}
                  {fieldErrors.email && (
                    <div className="field-error-msg">⚠️ {fieldErrors.email}</div>
                  )}
                  {fieldSuccess.email &&
                    !fieldErrors.email &&
                    !fieldValidating.email && (
                      <div className="field-success-msg">
                        ✓ {fieldSuccess.email}
                      </div>
                    )}
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
                    onBlur={handleBlur}
                    maxLength={10}
                    className={
                      fieldErrors.phone
                        ? "input-has-error"
                        : fieldSuccess.phone
                          ? "input-is-valid"
                          : ""
                    }
                  />
                  {fieldValidating.phone && (
                    <div className="field-checking-msg">
                      <span className="spinner-mini"></span> Checking phone availability...
                    </div>
                  )}
                  {fieldErrors.phone && (
                    <div className="field-error-msg">⚠️ {fieldErrors.phone}</div>
                  )}
                  {fieldSuccess.phone &&
                    !fieldErrors.phone &&
                    !fieldValidating.phone && (
                      <div className="field-success-msg">
                        ✓ {fieldSuccess.phone}
                      </div>
                    )}
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
                    onBlur={handleBlur}
                    className={
                      fieldErrors.password
                        ? "input-has-error"
                        : formData.password && !fieldErrors.password
                          ? "input-is-valid"
                          : ""
                    }
                  />
                  {fieldErrors.password && (
                    <div className="field-error-msg">⚠️ {fieldErrors.password}</div>
                  )}
                  {formData.password && (
                    <div className="password-strength-container">
                      <div className="password-strength-bar-track">
                        <div
                          className="password-strength-bar-fill"
                          style={{
                            width: `${calcPasswordStrength(formData.password).score}%`,
                            backgroundColor: calcPasswordStrength(formData.password).color,
                          }}
                        ></div>
                      </div>
                      <span
                        className="password-strength-label"
                        style={{ color: calcPasswordStrength(formData.password).color }}
                      >
                        Strength: {calcPasswordStrength(formData.password).label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      fieldErrors.confirmPassword
                        ? "input-has-error"
                        : formData.confirmPassword && !fieldErrors.confirmPassword
                          ? "input-is-valid"
                          : ""
                    }
                  />
                  {fieldErrors.confirmPassword && (
                    <div className="field-error-msg">⚠️ {fieldErrors.confirmPassword}</div>
                  )}
                  {formData.confirmPassword && !fieldErrors.confirmPassword && (
                    <div className="field-success-msg">✓ Passwords match</div>
                  )}
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
                    {fieldErrors.preferredCategories && (
                      <div className="field-error-msg">
                        ⚠️ {fieldErrors.preferredCategories}
                      </div>
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
                    {fieldErrors.location && (
                      <div className="field-error-msg">⚠️ {fieldErrors.location}</div>
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
                    {fieldErrors.verificationDoc && (
                      <div className="field-error-msg">
                        ⚠️ {fieldErrors.verificationDoc}
                      </div>
                    )}
                    {verificationFile && (
                      <div className="field-success-msg">
                        ✓ {verificationFile.name}
                      </div>
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
                    {fieldErrors.location && (
                      <div className="field-error-msg">⚠️ {fieldErrors.location}</div>
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
                      {fieldErrors.skills && (
                        <div className="field-error-msg">⚠️ {fieldErrors.skills}</div>
                      )}
                    </div>
                    <label>Date of Birth</label>
                    <input
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      max={maxDob}
                      min={minDob}
                      className={
                        fieldErrors.dob
                          ? "input-has-error"
                          : formData.dob && !fieldErrors.dob
                            ? "input-is-valid"
                            : ""
                      }
                    />
                    {fieldErrors.dob && (
                      <div className="field-error-msg">⚠️ {fieldErrors.dob}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Government ID (Aadhar / College ID / License)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleVolunteerIdChange}
                    />
                    {fieldErrors.volunteerIdFile && (
                      <div className="field-error-msg">
                        ⚠️ {fieldErrors.volunteerIdFile}
                      </div>
                    )}
                    {volunteerIdFile && (
                      <div className="field-success-msg">
                        ✓ {volunteerIdFile.name}
                      </div>
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
                    {fieldErrors.location && (
                      <div className="field-error-msg">⚠️ {fieldErrors.location}</div>
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
                {fieldErrors.agreedToTerms && (
                  <div className="field-error-msg">
                    ⚠️ {fieldErrors.agreedToTerms}
                  </div>
                )}
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
