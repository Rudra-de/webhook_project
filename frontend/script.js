const API_URL = "http://localhost:5000/api/webhook";

// Get form elements
const webhookForm = document.getElementById("webhookForm");
const responseDiv = document.getElementById("response");
const loadLogsButton = document.getElementById("loadLogs");
const logsTableBody = document.getElementById("logsTableBody");


// =====================================================
// SEND WEBHOOK
// =====================================================

webhookForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const payload = {
        event: document.getElementById("event").value,
        referenceId: document.getElementById("referenceId").value,
        message: document.getElementById("message").value
    };

    try {

        const response = await fetch(`${API_URL}/send`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        });

        const data = await response.json();

        responseDiv.style.display = "block";
        responseDiv.textContent = data.message;

        if (response.ok) {
            responseDiv.style.backgroundColor = "#dcfce7";
        } else {
            responseDiv.style.backgroundColor = "#fee2e2";
        }

    } catch (error) {

        responseDiv.style.display = "block";
        responseDiv.textContent = "Failed to connect to backend.";

        console.error(error);
    }
});


// =====================================================
// LOAD WEBHOOK LOGS
// =====================================================

loadLogsButton.addEventListener("click", async function () {

    try {

        const response = await fetch(`${API_URL}/logs`);

        const data = await response.json();

        logsTableBody.innerHTML = "";

        data.logs.forEach(function (log) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${log.event || "-"}</td>
                <td>${log.referenceId || "-"}</td>
                <td>${log.status || "-"}</td>
                <td>${log.statusCode || "-"}</td>
                <td>${new Date(log.receivedAt).toLocaleString()}</td>
            `;

            logsTableBody.appendChild(row);
        });

    } catch (error) {

        console.error("Error loading logs:", error);

        logsTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Failed to load webhook logs.
                </td>
            </tr>
        `;
    }
});