"use client";

import { useEffect, useState } from 'react';

export default function TokenDebugPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found in localStorage');
      return;
    }

    // Decode JWT (without verification - just to see payload)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError('Invalid token format');
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      setTokenInfo({
        raw: token.substring(0, 20) + '...',
        payload,
        expiresAt: new Date(payload.exp * 1000).toLocaleString(),
        isExpired: payload.exp * 1000 < Date.now()
      });
    } catch (err) {
      setError('Failed to decode token: ' + (err as Error).message);
    }
  }, []);

  const testUploadEndpoint = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      alert('Auth test result:\n' + JSON.stringify(data, null, 2));
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Token Debug Info</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {tokenInfo && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">Token (truncated):</h2>
            <code className="block bg-gray-100 p-2 rounded mt-1 text-sm">
              {tokenInfo.raw}
            </code>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Payload:</h2>
            <pre className="block bg-gray-100 p-2 rounded mt-1 text-sm overflow-auto">
              {JSON.stringify(tokenInfo.payload, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Expires At:</h2>
            <p className="text-sm">{tokenInfo.expiresAt}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Status:</h2>
            <p className={`text-sm font-semibold ${tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'}`}>
              {tokenInfo.isExpired ? '❌ EXPIRED' : '✅ VALID'}
            </p>
          </div>

          <button
            onClick={testUploadEndpoint}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Auth Endpoint
          </button>
        </div>
      )}
    </div>
  );
}
