'use client';

import { useState, useEffect } from 'react';

export default function YoutubeConvertPage() {
  const [url, setUrl] = useState('');
  const [taskId, setTaskId] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/youtube/status/${taskId}`);
          const data = await res.json();
          
          if (data.state === 'SUCCESS') {
            clearInterval(interval);
            setProgress(100);
            setStatusMsg('Complete! Downloading...');
            setLoading(false);
            setTaskId('');
            
            // Trigger download
            const link = document.createElement('a');
            link.href = data.download_url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
          } else if (data.state === 'FAILURE') {
            clearInterval(interval);
            setError(data.error || 'Conversion failed');
            setLoading(false);
            setTaskId('');
          } else {
            setProgress(data.progress || 0);
            setStatusMsg(data.status || 'Processing...');
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const handleStart = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setProgress(0);
    setStatusMsg('Queuing task...');
    
    try {
      const response = await fetch('http://localhost:8000/youtube/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) throw new Error('Failed to start conversion');
      
      const data = await response.json();
      setTaskId(data.task_id);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 mt-10">
      <h1 className="text-3xl font-bold">YouTube to MP3 Downloader</h1>
      <p className="text-gray-500">Fast, resilient queue-based downloader.</p>
      
      <div className="flex gap-4">
        <input 
          type="url" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-4 py-2 border rounded-md"
        />
        <button 
          onClick={handleStart}
          disabled={loading || !url}
          className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Download'}
        </button>
      </div>
      
      {loading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-600">{statusMsg} ({progress.toFixed(1)}%)</p>
        </div>
      )}
      
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
