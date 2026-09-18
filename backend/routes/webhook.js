const express = require("express");
const pool = require("../db");

const router = express.Router();


// =====================================================
// POST /api/webhook/send
// =====================================================

router.post("/send", async (req, res) => {

    const payload = req.body;

    try {

        // Send the payload to the receiver
        const response = await fetch(
            `http://localhost:${process.env.PORT || 5000}/api/webhook/receive`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-key": process.env.WEBHOOK_SECRET
                },

                body: JSON.stringify(payload)
            }
        );

        const responseData = await response.json();

        return res.status(response.status).json(responseData);

    } catch (error) {

        console.error("Send webhook error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send webhook",
            error: error.message
        });
    }
});


// =====================================================
// POST /api/webhook/receive
// =====================================================

router.post("/receive", async (req, res) => {

    const payload = req.body;

    try {

        // Read authentication header
        const webhookKey = req.headers["x-webhook-key"];


        // -------------------------------------------------
        // Check webhook key
        // -------------------------------------------------

        if (
            !webhookKey ||
            webhookKey !== process.env.WEBHOOK_SECRET
        ) {

            await pool.query(
                `
                INSERT INTO "WebhookLog"
                (
                    event,
                    "referenceId",
                    "requestPayload",
                    status,
                    "statusCode",
                    "errorMessage"
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [
                    payload?.event || null,
                    payload?.referenceId || null,
                    payload || {},
                    "Failed",
                    401,
                    "Missing or incorrect webhook key"
                ]
            );

            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid webhook key"
            });
        }


        // -------------------------------------------------
        // Validate webhook payload
        // -------------------------------------------------

        if (!payload || typeof payload !== "object") {

            return res.status(400).json({
                success: false,
                message: "Invalid webhook payload"
            });
        }


        // Check event
        if (!payload.event) {

            await pool.query(
                `
                INSERT INTO "WebhookLog"
                (
                    event,
                    "referenceId",
                    "requestPayload",
                    status,
                    "statusCode",
                    "errorMessage"
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [
                    null,
                    payload.referenceId || null,
                    payload,
                    "Failed",
                    400,
                    "event is required"
                ]
            );

            return res.status(400).json({
                success: false,
                message: "event is required"
            });
        }


        // Check referenceId
        if (!payload.referenceId) {

            await pool.query(
                `
                INSERT INTO "WebhookLog"
                (
                    event,
                    "referenceId",
                    "requestPayload",
                    status,
                    "statusCode",
                    "errorMessage"
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [
                    payload.event,
                    null,
                    payload,
                    "Failed",
                    400,
                    "referenceId is required"
                ]
            );

            return res.status(400).json({
                success: false,
                message: "referenceId is required"
            });
        }


        // -------------------------------------------------
        // Save successful webhook
        // -------------------------------------------------

        await pool.query(
            `
            INSERT INTO "WebhookLog"
            (
                event,
                "referenceId",
                "requestPayload",
                status,
                "statusCode",
                "errorMessage"
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                payload.event,
                payload.referenceId,
                payload,
                "Success",
                200,
                null
            ]
        );


        // -------------------------------------------------
        // Return success response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Webhook received"
        });

    } catch (error) {

        console.error("Receive webhook error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


// =====================================================
// GET /api/webhook/logs
// =====================================================

router.get("/logs", async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                id,
                event,
                "referenceId",
                "requestPayload",
                status,
                "statusCode",
                "errorMessage",
                "receivedAt"
            FROM "WebhookLog"
            ORDER BY "receivedAt" DESC
            `
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            logs: result.rows
        });

    } catch (error) {

        console.error("Get logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch webhook logs",
            error: error.message
        });
    }
});


module.exports = router;