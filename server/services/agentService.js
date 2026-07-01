const { askOllama } = require("./ollamaService");
const systemPrompt = require("../prompts/systemPrompt");

async function askAgent(message) {

    const prompt = `
${systemPrompt}

========================
TOOLS
========================

You have these tools available:

1. internet
2. automation
3. vision
4. memory
5. files

IMPORTANT

If one of these tools is required,

DO NOT answer.

Return ONLY valid JSON.

Example:

{
  "tool":"internet",
  "query":"latest NEET paper leak 2026"
}

Otherwise answer normally.

========================

USER:

${message}

ORION:
`;

    return await askOllama(prompt);

}

module.exports = {

    askAgent

};