'use client';

import { useState, useEffect } from 'react';
import { Download, PlayCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { PYTHON_API_URL } from '@/lib/api';

export default function YoutubeConvertPage() {
  const { user } = useAuthStore();
  const [url, setUrl] = useState('');
  const [jobId, setJobId] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${PYTHON_API_URL}/youtube/status/${jobId}`);
          if (!res.ok) return;
          const data = await res.json();
          
          if (data.status === 'COMPLETED') {
            clearInterval(interval);
            setProgress(100);
            setStatusMsg('Hoàn tất! Đã sẵn sàng tải xuống.');
            setLoading(false);
            setDownloadUrl(data.download_url);
            setJobId('');
            
            // Auto trigger download
            if (data.download_url) {
              const link = document.createElement('a');
              link.href = data.download_url;
              link.download = `audio-${jobId}.mp3`;
              link.target = "_blank";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            
          } else if (data.status === 'FAILED') {
            clearInterval(interval);
            setError(data.error || 'Quá trình chuyển đổi thất bại');
            setLoading(false);
            setJobId('');
          } else {
            setProgress(data.progress || 0);
            setStatusMsg(data.status === 'PENDING' ? 'Đang khởi tạo Job siêu tốc...' : 'Đang xử lý & tải với aria2c...');
          }
        } catch (err) {
          console.error(err);
        }
      }, 1000); // Poll every 1s for snappy feedback
    }
    return () => clearInterval(interval);
  }, [jobId]);

  const handleStart = async () => {
    if (!url) return;
    if (!user?.id) {
      setError('Bạn cần đăng nhập để thực hiện tính năng này');
      return;
    }
    setLoading(true);
    setError('');
    setProgress(0);
    setDownloadUrl('');
    setStatusMsg('Đang gửi request...');
    
    try {
      const response = await fetch(`${PYTHON_API_URL}/youtube/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          user_id: user.id
        }),
      });
      
      if (!response.ok) throw new Error('Không thể khởi tạo tiến trình');
      
      const data = await response.json();
      setJobId(data.job_id);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi hệ thống');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 transition-colors duration-500">
      <div className="max-w-3xl w-full bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl p-8 md:p-12 transition-all duration-300 hover:shadow-cyan-500/10">
        
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="text-center space-y-4 mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
            Superfast Audio Downloader
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Sức mạnh của Queue Worker + aria2c. Không chờ đợi, tải tức thì.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8 relative">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <PlayCircle className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Dán link YouTube hoặc SoundCloud vào đây..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800 dark:text-gray-100 text-lg shadow-inner"
            />
          </div>
          <button 
            onClick={handleStart}
            disabled={loading || !url}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              <>
                <span>Bắt đầu</span>
                <Download className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </div>
        
        {loading && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
              <p className="text-sm font-medium text-blue-600 dark:text-cyan-400 animate-pulse">{statusMsg}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{progress.toFixed(0)}%</p>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        )}

        {downloadUrl && !loading && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 dark:text-green-400 font-medium">Hoàn tất thành công!</p>
                <p className="text-green-600 dark:text-green-500 text-sm">File đã được tải xuống máy của bạn.</p>
              </div>
            </div>
            <a 
              href={downloadUrl} 
              target="_blank"
              download
              className="px-4 py-2 bg-white dark:bg-gray-800 text-green-600 border border-green-200 hover:bg-green-50 rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              Tải lại
            </a>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3 animate-in shake">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
