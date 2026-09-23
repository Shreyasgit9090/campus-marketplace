const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const itemsDir = path.join(__dirname, '..', '..', 'uploads', 'items');
fs.mkdirSync(itemsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, itemsDir),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image uploads (jpeg, png, webp, gif) are allowed'));
};

const uploadItemImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024,
    files: 6,
  },
});

module.exports = { uploadItemImages };
