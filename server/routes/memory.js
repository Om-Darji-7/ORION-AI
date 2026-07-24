const express = require("express");

const {
  extractFacts,
} = require(
  "../controllers/memoryController"
);

const router = express.Router();

router.post("/extract", extractFacts);

module.exports = router;