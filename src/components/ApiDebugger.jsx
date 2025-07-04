import React, { useState, useEffect } from 'react';

const ApiDebugger = () => {
  const [apiCalls, setApiCalls] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.checkersApiCalls) {
        setApiCalls([...window.checkersApiCalls]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearApiCalls = () => {
    window.checkersApiCalls = [];
    setApiCalls([]);
  };

  const deleteApiObjects = async () => {
    // In this case, we'll delete the AI agent if it exists
    const agentCalls = apiCalls.filter(call => 
      call.endpoint === '/api_tools/create-agent' && 
      call.type === 'RESPONSE' && 
      call.data.agent_id
    );

    for (const call of agentCalls) {
      try {
        await fetch(`/api_tools/delete-agent/${call.data.agent_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer hrvbv45mdftmconqclw'
          }
        });
      } catch (error) {
        console.error('Failed to delete agent:', error);
      }
    }
    
    // Reset the game after deleting objects
    if (window.resetCheckersGame) {
      window.resetCheckersGame();
    }
  };

  return (
    <div className="game-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        API Debug Panel
      </h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="btn-success flex-1"
            aria-label="Show API debug information"
          >
            {showDebug ? 'Hide' : 'Show'} API Calls ({apiCalls.length})
          </button>
          
          <button
            onClick={deleteApiObjects}
            className="btn-danger flex-1"
            aria-label="Delete API objects and reset game"
          >
            Delete Objects
          </button>
        </div>

        {showDebug && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                API Call Log
              </span>
              <button
                onClick={clearApiCalls}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear Log
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {apiCalls.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No API calls yet
                </p>
              ) : (
                apiCalls.map((call, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-xs ${
                      call.type === 'ERROR' 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                        : call.type === 'REQUEST'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-medium ${
                        call.type === 'ERROR' ? 'text-red-700 dark:text-red-300' :
                        call.type === 'REQUEST' ? 'text-blue-700 dark:text-blue-300' :
                        'text-green-700 dark:text-green-300'
                      }`}>
                        {call.type} - {call.endpoint}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(call.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDebugger;
