// ==========================================
// middleware/upload.js
// ==========================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Magic bytes for allowed file types
const MAGIC_BYTES = {
    'image/jpeg':  [0xFF, 0xD8, 0xFF],
    'image/png':   [0x89, 0x50, 0x4E, 0x47],
    'image/gif':   [0x47, 0x49, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

// Extensions that are always blocked regardless of MIME type
const BLOCKED_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.php',
    '.js', '.py', '.rb', '.pl', '.cgi', '.htaccess'
];

function sanitizeFilename(originalName) {
    // Get just the filename, no directory traversal
    const base = path.basename(originalName);
    // Replace anything that's not alphanumeric, dot, dash, or underscore
    return base.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

function checkMagicBytes(buffer, mimetype) {
    const magic = MAGIC_BYTES[mimetype];
    if (!magic) return true; // Allow types we don't check (Word, Excel) — extension check covers them

    return magic.every((byte, i) => buffer[i] === byte);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const sanitized = sanitizeFilename(file.originalname);
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(sanitized);
        cb(null, `${unique}${ext}`);
    }
});

const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`File type ${ext} is not allowed`), false);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('File type not allowed'), false);
    }

    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
    fileFilter
});

// Middleware to verify magic bytes after upload
// Use this after upload.single() in file routes
const verifyFileMagicBytes = (req, res, next) => {
    if (!req.file) return next();

    const buffer = fs.readFileSync(req.file.path);
    const isValid = checkMagicBytes(buffer, req.file.mimetype);

    if (!isValid) {
        // Delete the suspicious file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            success: false,
            message: 'File content does not match its type'
        });
    }

    next();
};

module.exports = upload;
module.exports.verifyFileMagicBytes = verifyFileMagicBytes;