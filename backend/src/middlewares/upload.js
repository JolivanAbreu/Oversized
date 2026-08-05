const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/apiError');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.', 'invalid_image_type'));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOADS_DIR };
