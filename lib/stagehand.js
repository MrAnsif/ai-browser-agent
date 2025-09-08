import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

export class BrowserManager {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(sessionId) {
    const stagehand = new Stagehand({
      env: "BROWSERBASE", // BROWSERBASE / LOCAL
      // LLM Configuration for AI actions (act, extract, observe)
      modelName: "google/gemini-2.0-flash", // Correct model name:cite[10]
      modelClientOptions: {
        apiKey: process.env.GEMINI_API_KEY, // Ensure this env variable is set
        // baseURL is not needed for Gemini - it uses default Google endpoints
      },
      // Browserbase Configuration
      apiKey: process.env.BROWSERBASE_API_KEY, // Should be at root level:cite[8]
      projectId: process.env.BROWSERBASE_PROJECT_ID, // Should be at root level:cite[8]
      browserbaseSessionCreateParams: { // Correct property name:cite[8]
        // Additional recommended options:
        timeout: 3600, // 1 hour session timeout
        keepAlive: true, // Keep session alive
        browserSettings: {
          liveView: true, // Enable Live View
          viewport: { width: 1280, height: 720 },
          blockAds: true,
          solveCaptchas: true,
        }
      },
      // Debugging Options
      disablePino: true,
      debugDom: true,
      enableCaching: true,
    });

    await stagehand.init();

    const { Browserbase } = require('@browserbasehq/sdk');
    const bb = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY
    });

    // Get the Browserbase session ID from the Stagehand instance
    const browserbaseSessionId = stagehand.browserbaseSessionID;

    if (!browserbaseSessionId) {
      throw new Error('Failed to retrieve Browserbase session ID from Stagehand at lib');
    }

    // Get Live View links using the Browserbase SDK
    const liveViewLinks = await bb.sessions.debug(browserbaseSessionId);
    const liveViewUrl = liveViewLinks.debuggerFullscreenUrl;

    const session = {
      id: sessionId,
      stagehand,
      liveViewUrl,
      browserbaseSessionId,
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

  async executeCommand(sessionId, commands, action) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.lastActivity = new Date();
    const page = session.stagehand.page;

    // Handle single command (backward compatibility)
    if (!Array.isArray(commands)) {
      commands = [{ command: commands, action: action }];
    }

    const results = [];
    let finalScreenshot = null;
    let allMessages = [];

    try {
      for (let i = 0; i < commands.length; i++) {
        const { command, action: cmdAction } = commands[i];
        const currentAction = cmdAction || action;

        console.log('Current command: ', command, currentAction)
        let result = null;

        switch (currentAction) {
          case "navigate":
            let url = command.trim();

            // Strip prefixes like "go to", "open", etc.
            url = url.replace(/^(go to|open)\s+/i, "").trim();

            // If it doesn't start with http, add https://
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
            const agent = session.stagehand.agent();
            result = await agent.execute(command);
            break;

          default:
            throw new Error(`Unknown action: ${currentAction}`);
        }

        results.push(result);
        allMessages.push(`Executed: ${command}`);
      }

      // Take screenshot after all actions
      finalScreenshot = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      return {
        success: true,
        screenshot: finalScreenshot.toString("base64"),
        message: allMessages.join(" | "),
        result: results.length === 1 ? results[0] : results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Failed to execute commands`,
      };
    }
  }
}

export const browserManager = new BrowserManager();