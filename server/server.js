const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/leetcode", async (req, res) => {
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",         // Required by LeetCode
        "Origin": "https://leetcode.com",          // Required by LeetCode
        "User-Agent": "Mozilla/5.0",               // Pretend it's a browser
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!data || data.errors) {
      console.error("LeetCode Error:", data.errors);
      return res.status(500).json({ error: "LeetCode fetch failed" });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "LeetCode fetch failed" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});