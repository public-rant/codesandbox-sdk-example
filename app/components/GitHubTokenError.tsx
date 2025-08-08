'use client';

interface GitHubTokenErrorProps {
  onRetry?: () => void;
}

export default function GitHubTokenError({ onRetry }: GitHubTokenErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Missing GitHub Token</h1>
          <p className="text-gray-600 mb-6">
            A GitHub token is required to create projects and integrate with CodeSandbox.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Setup Instructions:</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
              <span>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Settings → Developer settings → Personal access tokens</a></span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
              <span>Create a new token with repo permissions</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
              <span>Set the environment variable:</span>
            </li>
          </ol>
          
          <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
            GITHUB_TOKEN=your_token_here
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Add this to your .env.local file or environment variables
          </p>
        </div>

        {onRetry && (
          <div className="text-center">
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Check Again
            </button>
          </div>
        )}

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Restart your development server after setting the token
          </p>
        </div>
      </div>
    </div>
  );
}