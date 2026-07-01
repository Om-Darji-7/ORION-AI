const express = require("express");
const cors = require("cors");

const chatRoute = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoute);

app.get("/", (req, res) => {
  res.send("ORION Backend Online");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 ORION Backend running on ${PORT}`);
});