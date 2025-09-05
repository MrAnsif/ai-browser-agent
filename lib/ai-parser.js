export async function parseCommand(userInput) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "mistralai/mistral-small-3.1-24b-instruct:free",
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

Return JSON in this format:
{
  "action": "navigate|act|extract|observe|agent_execute",
  "command": "specific instruction for the action or link to navigate",
  "parameters": {},
  "confidence": 0.95
}`
                },
                {
                    role: "user",
                    content: userInput
                }
            ],
        }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Remove code fences if the model wrapped the JSON in ```json ... ```
    content = content.replace(/```json|```/g, "").trim();

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (err) {
        console.error("Failed to parse AI response:", err, content);
        parsed = [];
    }

    console.log("Parsed commands:", parsed);
    return parsed;
}
