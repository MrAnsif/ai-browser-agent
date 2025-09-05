'use client';

import { useState } from 'react';
import CommandInput from './CommandInput';
import VoiceInput from './VoiceInput';

export default function BrowserInterface() {
  const [session, setSession] = useState({
    sessionId: null,
    screenshot: null,
    isExecuting: false,
    history: [],
  });

  const createSession = async () => {
    try {
      const response = await fetch('/api/browser/create-session', {
        method: 'POST',
      });
      const data = await response.json();
      setSession(prev => ({
        ...prev,
        sessionId: data.sessionId,
      }));
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const executeCommand = async (command) => {
    if (!session.sessionId) return;

    setSession(prev => ({ ...prev, isExecuting: true }));

    try {
      const response = await fetch('/api/browser/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          userInput: command,
        }),
      });

      const data = await response.json();
      console.log('data response from execute-command in frontend: ', data)
      
      setSession(prev => ({
        ...prev,
        screenshot: data.result.screenshot || prev.screenshot,
        history: [...prev.history, {
          command,
          result: data.result,
          timestamp: new Date(),
        }],
        isExecuting: false,
      }));
    } catch (error) {
      console.error('Command execution failed:', error);
      setSession(prev => ({ ...prev, isExecuting: false }));
    }
  };

  const closeSession = async () => {
    if (!session.sessionId) return;
    
    await fetch('/api/browser/close-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId }),
    });
    
    setSession({
      sessionId: null,
      screenshot: null,
      isExecuting: false,
      history: [],
    });
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Browser Viewport */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <h1 className="text-white text-xl">AI Browser Agent</h1>
          <div className="space-x-2">
            {!session.sessionId ? (
              <button
                onClick={createSession}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Start Session
              </button>
            ) : (
              <button
                onClick={closeSession}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                End Session
              </button>
            )}
          </div>
        </div>
        
        {/* Screenshot Display */}
        <div className="flex-1 bg-white overflow-hidden">
          {session.screenshot ? (
            <img
              src={`data:image/png;base64,${session.screenshot}`}
              alt="Browser Screenshot"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {session.sessionId ? 'Waiting for first command...' : 'Start a session to begin'}
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-96 bg-gray-800 text-white flex flex-col">
        {/* Command Input */}
        <div className="p-4 border-b border-gray-700">
          <CommandInput
            onCommand={executeCommand}
            disabled={!session.sessionId || session.isExecuting}
            isExecuting={session.isExecuting}
          />
          <div className="mt-2">
            <VoiceInput
              onCommand={executeCommand}
              disabled={!session.sessionId || session.isExecuting}
            />
          </div>
        </div>

        {/* Command History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold mb-4">Command History</h3>
          <div className="space-y-3">
            {session.history.map((entry, index) => (
              <div key={index} className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-300">
                  {entry.timestamp.toLocaleTimeString()}
                </div>
                <div className="font-medium">{entry.command}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {entry.result.success ? '✅ Success' : '❌ Failed'}
                </div>
                {entry.result.error && (
                  <div className="text-sm text-red-400 mt-1">
                    Error: {entry.result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}