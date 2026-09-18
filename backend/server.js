const express = require("express");
const cors = require("cors");
require("dotenv").config();

const webhookRoutes = require("./routes/webhook");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Webhook server is running"
    });
});

// Webhook routes
app.use("/api/webhook", webhookRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});