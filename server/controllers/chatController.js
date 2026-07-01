const { askAgent } = require("../services/agentService");
const systemPrompt = require("../prompts/systemPrompt");
const { decide } = require("../services/plannerService");

async function chat(req, res) {
  try {
    const { message } = req.body;
    const plan = await decide(message);

    console.log("========== ORION PLAN ==========");
    console.log(plan);
    console.log("================================");
    const prompt = `
${systemPrompt}

USER:
${message}

ORION:
`;

    const reply = await askAgent(prompt);

    res.json({
      success: true,
      reply,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}

module.exports = {
  chat,
};