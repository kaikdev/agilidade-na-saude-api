const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pasta onde as imagens serão salvas
const uploadDir = path.join(__dirname, "../uploads/admins");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({ storage: storage });

module.exports = upload;