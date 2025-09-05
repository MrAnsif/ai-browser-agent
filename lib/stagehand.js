import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

export class BrowserManager {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(sessionId) {
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      modelName: "gemini-2.0-flash-exp", // Updated to correct Gemini model name
      modelClientOptions: {
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      },
      browserbaseOptions: { // Fixed: renamed from 'browserbase' to 'browserbaseOptions'
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
      },
      debugDom: true,
      enableCaching: true,
    });

    await stagehand.init();

    const session = {
      id: sessionId,
      stagehand,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.stagehand.close();
      this.sessions.delete(sessionId);
    }
  }

  async executeCommand(sessionId, command, action) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.lastActivity = new Date();
    const page = session.stagehand.page;

    try {
      let result = null;

      switch (action) {
        case "navigate":
          let url = command.trim();

          // Strip prefixes like "go to", "open", etc.
          url = url.replace(/^(go to|open)\s+/i, "").trim();

          // If it doesn’t start with http, add https://
          if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
          }

          await page.goto(url, { waitUntil: "load" });
          result = { navigatedTo: url };
          break;

        case "act":
          result = await page.act({
            action: command
          });
          break;

        case "extract":
          result = await page.extract({
            instruction: command,
            schema: z.object({
              data: z.any(),
            }),
          });
          break;

        case "observe":
          result = await page.observe(command);
          break;

        case "agent_execute":
          // Fixed: Use stagehand.agent() method correctly
          const agent = session.stagehand.agent();
          result = await agent.execute(command);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Take screenshot after action
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      return {
        success: true,
        screenshot: screenshot.toString("base64"),
        message: `Executed: ${command}`,
        result: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Failed to execute: ${command}`,
      };
    }
  }
}

export const browserManager = new BrowserManager();