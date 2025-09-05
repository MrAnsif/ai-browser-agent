export async function parseCommand(userInput) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3.1:free",
            messages: [
                {
                    role: "system",
                    content: `You are a browser automation command parser. Parse user requests into structured commands.
Available actions:
- navigate: Go to a URL (e.g., "go to google.com", "open youtube")
- act: Perform actions like clicking, typing, scrolling (e.g., "click search button", "type hello")
- extract: Extract information from the page (e.g., "get all links", "extract product prices")
- observe: Analyze what's on the page (e.g., "what can I click here?", "describe the page")
- agent_execute: Complex multi-step tasks (e.g., "search for cars and find the cheapest one")

Return ONLY valid JSON array in this exact format, without any markdown formatting or additional text:
[
  {
    "action": "navigate|act|extract|observe|agent_execute",
    "command": "specific instruction",
    "parameters": {},
    "confidence": 0.95
  },
  {
    "action": "navigate|act|extract|observe|agent_execute",
    "command": "specific instruction",
    "parameters": {},
    "confidence": 0.95
  }
]
Do not use code blocks or any other formatting.`
                },
                {
                    role: "user",
                    content: userInput
                }
            ],
            response_format: { type: "json_object" }
        }),
    });

    const data = await response.json();

    if (data.error) {
        console.error("AI response Error:", data.error);
        return [];
    }

    let parsed = [];
    try {
        let content = data.choices[0].message.content;

        // Clean the response - remove markdown code blocks if present
        content = cleanJsonResponse(content);

        parsed = JSON.parse(content);

        // Ensure we always return an array
        if (!Array.isArray(parsed)) {
            parsed = [parsed];
        }

    } catch (err) {
        console.error("Failed to parse AI response:", err, data);
        parsed = [];
    }

    console.log("Parsed commands:", parsed);
    return parsed;
}

// Helper function to clean JSON responses with markdown code blocks
function cleanJsonResponse(content) {
    // Remove ```json and ``` markers
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Remove any other potential markdown artifacts
    content = content.trim();

    // If it's still wrapped in any code blocks, remove them
    if (content.startsWith('`') && content.endsWith('`')) {
        content = content.slice(1, -1).trim();
    }

    return content;
}
