import React, { useState, useEffect, useRef } from 'react';

const RiddleGame = () => {
  const [agentId, setAgentId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [showApiLogs, setShowApiLogs] = useState(false);
  const [createdObjects, setCreatedObjects] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE = 'https://builder.empromptu.ai/api_tools';
  const headers = {
    'Authorization': 'Bearer vdic5f9td8nmcoofrrq',
    'Content-Type': 'application/json'
  };

  const logApiCall = (endpoint, method, data, response) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      request: data,
      response
    };
    setApiLogs(prev => [...prev, logEntry]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const createRiddleAgent = async () => {
    setLoading(true);
    try {
      const requestData = {
        instructions: `You are a friendly riddle master who loves challenging people with fun puzzles! Your job is to run a 5-riddle game session. Here's how you work:

1. Start by greeting the player warmly and explaining you have 5 riddles for them
2. Present riddles one at a time - use a mix of word puzzles, logic puzzles, classic riddles, and brain teasers of varying difficulty
3. After each answer, tell them if they're right or wrong, give the correct answer if they were wrong, and offer encouraging feedback
4. Keep track of their score (X out of 5 correct)
5. After 5 riddles, congratulate them on completing the game and tell them their final score
6. Be encouraging, friendly, and fun throughout!

Wait for their answer before moving to the next riddle. Make the riddles engaging and varied!`,
        agent_name: "Riddle Master"
      };

      const response = await fetch(`${API_BASE}/create-agent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      logApiCall('/create-agent', 'POST', requestData, data);
      setAgentId(data.agent_id);
      setCreatedObjects(prev => [...prev, `agent_${data.agent_id}`]);
      
      // Start the game
      const chatRequestData = {
        agent_id: data.agent_id,
        message: "Hi! I'm ready to play the riddle game!"
      };

      const chatResponse = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(chatRequestData)
      });
      
      const chatData = await chatResponse.json();
      logApiCall('/chat', 'POST', chatRequestData, chatData);
      setConversation([{ type: 'ai', message: chatData.response }]);
      setGameStarted(true);
    } catch (error) {
      console.error('Error creating agent:', error);
      logApiCall('/create-agent', 'POST', requestData, { error: error.message });
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !agentId) return;
    
    setLoading(true);
    const userMessage = userInput;
    setUserInput('');
    
    setConversation(prev => [...prev, { type: 'user', message: userMessage }]);
    
    try {
      const requestData = {
        agent_id: agentId,
        message: userMessage
      };

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      logApiCall('/chat', 'POST', requestData, data);
      setConversation(prev => [...prev, { type: 'ai', message: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      logApiCall('/chat', 'POST', requestData, { error: error.message });
    }
    setLoading(false);
  };

  const resetGame = () => {
    setAgentId(null);
    setConversation([]);
    setUserInput('');
    setGameStarted(false);
    createRiddleAgent();
  };

  const deleteAllObjects = async () => {
    for (const objectName of createdObjects) {
      try {
        const response = await fetch(`${API_BASE}/objects/${objectName}`, {
          method: 'DELETE',
          headers
        });
        const data = await response.json();
        logApiCall(`/objects/${objectName}`, 'DELETE', null, data);
      } catch (error) {
        logApiCall(`/objects/${objectName}`, 'DELETE', null, { error: error.message });
      }
    }
    setCreatedObjects([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto max-w-4xl p-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🧩</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riddle Master</h1>
                <p className="text-gray-600 dark:text-gray-400">Challenge your mind with 5 fun riddles!</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {!gameStarted ? (
          /* Welcome Screen */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎯</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ready for a Challenge?</h2>
              <p className="text-gray-600 dark:text-gray-400">Test your wit with 5 carefully crafted riddles from our friendly AI Riddle Master!</p>
            </div>
            <button 
              onClick={createRiddleAgent}
              disabled={loading}
              className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-3 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label="Start riddle game"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Starting Game...</span>
                </div>
              ) : (
                'Start Riddle Game!'
              )}
            </button>
          </div>
        ) : (
          /* Game Interface */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4" role="log" aria-live="polite" aria-label="Game conversation">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'chat-bubble-user rounded-br-md' 
                      : 'chat-bubble-ai rounded-bl-md'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {msg.type === 'ai' && (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-white">🎭</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1 opacity-75">
                          {msg.type === 'user' ? 'You' : 'Riddle Master'}
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="chat-bubble-ai max-w-xs px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Riddle Master is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows="2"
                    disabled={loading}
                    aria-label="Enter your answer to the riddle"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={loading || !userInput.trim()}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label="Send answer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3">
              <button
                onClick={resetGame}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                New Game
              </button>
              <button
                onClick={() => setShowApiLogs(!showApiLogs)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {showApiLogs ? 'Hide' : 'Show'} API Logs
              </button>
              <button
                onClick={deleteAllObjects}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                disabled={createdObjects.length === 0}
              >
                Delete Objects ({createdObjects.length})
              </button>
            </div>
          </div>
        )}

        {/* API Logs */}
        {showApiLogs && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Call Logs</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {apiLogs.map((log, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                      {log.method} {log.endpoint}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      View Details
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">Request:</strong>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.request, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">Response:</strong>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
              {apiLogs.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No API calls yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiddleGame;
