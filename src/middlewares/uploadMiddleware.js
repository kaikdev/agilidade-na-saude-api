const multer = require("multer");
const path = require("path");
const fs = require("fs");

const adminUploadDir = path.join(__dirname, "../uploads/admins");
const userUploadDir = path.join(__dirname, "../uploads/documents");

if (!fs.existsSync(adminUploadDir)) {
    fs.mkdirSync(adminUploadDir, { recursive: true });
}
if (!fs.existsSync(userUploadDir)) {
    fs.mkdirSync(userUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (req.originalUrl.includes("/api/admin")) {
            cb(null, adminUploadDir);
        } 
        else if (req.originalUrl.includes("/api/users")) {
            cb(null, userUploadDir);
        } 
        else {
            cb(new Error("Rota de upload inválida"), null);
        }
    },
    
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({ storage: storage });

module.exports = upload;