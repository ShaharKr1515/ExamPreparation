const express = require("express");
const path = require("path");

const app = express();

// Serve the exam-preparation table (public/) — no data is ever persisted.
app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});
