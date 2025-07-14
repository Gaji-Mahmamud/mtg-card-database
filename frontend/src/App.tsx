import { useState, useEffect } from 'react'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'

// API function using native fetch
const fetchBackendData = async () => {
  const response = await fetch('http://127.0.0.1:8000/')
  if (!response.ok) {
    throw new Error('Failed to fetch backend data')
  }
  return response.json()
}

// Main component
function BackendTest() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['backend-test'],
    queryFn: fetchBackendData,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          MTG Card Database
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Backend Connection Test
          </h2>
          
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Connecting to backend...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800 font-medium">❌ Connection Error</div>
              <div className="text-red-600 text-sm mt-1">
                {error.message}
              </div>
              <div className="text-red-500 text-xs mt-2">
                Make sure your FastAPI server is running on http://127.0.0.1:8000
              </div>
            </div>
          )}
          
          {data && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800 font-medium">✅ Backend Connected!</div>
              <pre className="bg-white border rounded mt-3 p-3 text-sm overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// App wrapper with QueryClient
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BackendTest />
    </QueryClientProvider>
  )
}

export default App