const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and their valid extensions
const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a cryptographically random filename to prevent path traversal and name collisions
    const randomHex = crypto.randomBytes(16).toString("hex");
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || ".bin";
    cb(null, `${Date.now()}-${randomHex}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, GIF, WebP, PDF.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum per file
    files: 10, // max 10 files per request
  },
});

module.exports = upload;
