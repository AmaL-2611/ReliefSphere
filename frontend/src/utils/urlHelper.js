import API from "../api/axios";

/**
 * Returns the base URL of the backend server (without trailing /api or slash).
 * Works seamlessly whether running locally on localhost or hosted in production (e.g. Render/Vercel).
 */
export const getBackendBaseURL = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }

  if (API.defaults.baseURL && typeof API.defaults.baseURL === "string") {
    return API.defaults.baseURL.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }

  return "http://localhost:5000";
};

/**
 * Normalizes any uploaded file path or image URL into a valid, reachable URL.
 * Handles:
 *   - Absolute Linux paths from Render (e.g. /opt/render/project/src/backend/uploads/xxx.pdf)
 *   - Windows backslash paths (e.g. uploads\xxx.pdf or backend\uploads\xxx.pdf)
 *   - Relative paths (e.g. uploads/xxx.pdf or /uploads/xxx.pdf)
 *   - Bare filenames (e.g. 172969...pdf)
 *   - External absolute HTTP/HTTPS URLs (returns as-is)
 */
export const getFileUrl = (pathOrUrl) => {
  if (!pathOrUrl) return "";

  if (typeof pathOrUrl !== "string") {
    return "";
  }

  const clean = pathOrUrl.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("blob:") || clean.startsWith("data:")) {
    return clean;
  }

  // Extract the filename portion to safeguard against absolute server filesystem paths
  const filename = clean.split(/[\\/]/).pop();
  if (!filename) return "";

  const base = getBackendBaseURL();
  return `${base}/uploads/${filename}`;
};
