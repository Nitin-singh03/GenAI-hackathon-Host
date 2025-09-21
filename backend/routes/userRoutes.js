const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/uploadController.js");
const userController = require("../controllers/userController.js");
const { authenticateToken } = require("../middleware/auth.js");

const router = express.Router();

// Multer setup
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Auth routes
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// File upload route (protected)
router.post("/upload", authenticateToken, upload.single("file"), uploadController.uploadDocument);

// AI processing routes (protected)
router.post("/summarize", authenticateToken, uploadController.summarizeDocument);
router.post("/ask", authenticateToken, uploadController.askQuestion);
router.get("/document/:documentId", authenticateToken, uploadController.getDocument);
router.get("/documents", authenticateToken, uploadController.getUserDocuments);
router.get("/chat/:documentId", authenticateToken, uploadController.getChatHistory);
router.delete("/document/:documentId", authenticateToken, uploadController.deleteDocument);

module.exports = router;