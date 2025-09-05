import { NextResponse } from 'next/server';
import { browserManager } from '../../../../lib/stagehand.js';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    await browserManager.closeSession(sessionId);
    
    return NextResponse.json({
      message: 'Session closed successfully',
    });
  } catch (error) {
    console.error('Session close error:', error);
    return NextResponse.json(
      { error: 'Failed to close session' },
      { status: 500 }
    );
  }
}