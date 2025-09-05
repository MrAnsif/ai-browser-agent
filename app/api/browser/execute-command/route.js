import { NextResponse } from 'next/server';
import { browserManager } from '../../../../lib/stagehand.js';
import { parseCommand } from '../../../../lib/ai-parser.js';

export async function POST(request) {
  try {
    const { sessionId, userInput } = await request.json();

    // Parse the user command using AI
    const parsedCommand = await parseCommand(userInput);

    // Execute the command
    const result = await browserManager.executeCommand(
      sessionId,
      parsedCommand.command,
      parsedCommand.action
    );

    return NextResponse.json({
      result,
      parsedCommand,
      userInput,
      liveViewUrl: result.liveViewUrl,
    });
  } catch (error) {
    console.error('Command execution error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}