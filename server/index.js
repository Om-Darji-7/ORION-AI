require("dotenv").config();

const express = require("express");
const cors = require("cors");

const chatRoute =
  require("./routes/chat");

const memoryRoute =
  require("./routes/memory");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use("/api/chat", chatRoute);

app.use(
  "/api/memory",
  memoryRoute
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "IGRIS Backend",
    status: "online",
  });
});

const PORT =
  Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 IGRIS Backend running on ${PORT}`
  );

  console.log(
    "🧠 Generic memory extractor ready"
  );
});