import { NextResponse } from 'next/server';
import { browserManager } from '../../../../lib/stagehand.js';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const sessionId = uuidv4();
    const session = await browserManager.createSession(sessionId);
    
    return NextResponse.json({
      sessionId: session.id,
      liveViewUrl: session.liveViewUrl, // Added: Return Live View URL
      message: 'Browser session created successfully',
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create browser session' },
      { status: 500 }
    );
  }
}