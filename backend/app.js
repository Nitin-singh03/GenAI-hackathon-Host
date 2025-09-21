const express = require('express');
const cors = require('cors'); // ✅ Import CORS
const userRoutes = require('./routes/userRoutes');
const cookies = require("cookie-parser");
const app = express();
app.use(cookies());
app.use(express.json());
// ✅ Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend to access backend
  methods: 'GET,POST,PUT,DELETE,PATCH', // Allowed HTTP methods
  allowedHeaders: 'Content-Type,Authorization', // Allowed headers
}));
app.use('/', userRoutes);

module.exports = app;