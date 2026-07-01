function detectIntent(message) {

    const text = message.toLowerCase();

    // Automation
    if (
        text.includes("open ") ||
        text.includes("launch ") ||
        text.includes("start ")
    ) {

        return "automation";

    }

    // Current Information
    if (
        text.includes("today") ||
        text.includes("latest") ||
        text.includes("news") ||
        text.includes("current") ||
        text.includes("this year") ||
        text.includes("yesterday") ||
        text.includes("breaking")
    ) {

        return "internet";

    }

    // Default

    return "llm";

}

module.exports = {

    detectIntent

};