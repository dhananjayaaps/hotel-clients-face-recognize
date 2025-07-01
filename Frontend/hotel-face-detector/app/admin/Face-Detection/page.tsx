// app/check-in/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Video, VideoOff, Wifi, WifiOff, CheckCircle2, XCircle, User } from 'lucide-react';
import Button from '@/app/components/ui/Button';

interface FaceResult {
  name: string;
  status: 'Live' | 'Not Live';
  bbox: [number, number, number, number];
}

export default function CheckInPage() {
  const [results, setResults] = useState<FaceResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const checkInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      disconnect();
      if (checkInTimeoutRef.current) {
        clearTimeout(checkInTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        setIsLoading(false);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsRef.current = new WebSocket(`${protocol}//localhost:8000/ws/face`);

      wsRef.current.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setIsLoading(false);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: FaceResult[] = JSON.parse(event.data);
          setResults(data);
          frameCountRef.current += 1;
          
          const now = performance.now();
          if (now - lastFpsUpdateRef.current > 1000) {
            setFps(Math.round(frameCountRef.current * 1000 / (now - lastFpsUpdateRef.current)));
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }

          // Handle check-in logic
          handleCheckIn(data);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setError('Connection error. Please try again.');
        setIsLoading(false);
        disconnect();
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        setCameraActive(false);
      };
    } catch (err) {
      console.error('Initialization Error:', err);
      setError('Failed to initialize. Please check camera permissions.');
      setIsLoading(false);
      disconnect();
    }
  };

  const handleCheckIn = (faces: FaceResult[]) => {
    // Find the first live recognized face (not "Unknown")
    const validFace = faces.find(face => face.status === 'Live' && face.name !== 'Unknown');

    if (validFace) {
      setCurrentUser(validFace.name);
      setCheckInStatus('success');
      
      // Reset after 5 seconds
      if (checkInTimeoutRef.current) {
        clearTimeout(checkInTimeoutRef.current);
      }
      checkInTimeoutRef.current = setTimeout(() => {
        setCheckInStatus('pending');
        setCurrentUser(null);
      }, 5000);
    } else if (faces.length > 0 && faces.some(face => face.name !== 'Unknown')) {
      setCheckInStatus('failed');
    } else {
      setCheckInStatus('pending');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' 
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }

      streamRef.current = stream;
      processVideo();
      return true;
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Could not access camera. Please check permissions.');
      return false;
    }
  };

  const processVideo = () => {
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || !video.videoWidth || !video.videoHeight) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(blob);
        }
      }, 'image/jpeg', 0.8);

      drawResults(ctx, canvas.width, canvas.height);

      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  const drawResults = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    results.forEach(result => {
      const [left, top, right, bottom] = result.bbox;
      const name = result.name;
      const status = result.status;

      ctx.strokeStyle = status === 'Live' ? '#00FF00' : '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, right - left, bottom - top);

      ctx.fillStyle = status === 'Live' ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      const text = `${name} (${status})`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(left, top - 25, Math.max(textWidth + 10, right - left), 25);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(text, left + 5, top - 7);
    });
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setResults([]);
    setFps(0);
    setIsConnected(false);
    setCameraActive(false);
    setCheckInStatus('pending');
    setCurrentUser(null);
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connectWebSocket();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In System</h1>
          <p className="text-gray-600">
            Face recognition for secure check-in
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Feed Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative bg-black">
              <video 
                ref={videoRef} 
                className={`w-full aspect-video ${cameraActive ? '' : 'hidden'}`}
                muted
                playsInline
              />
              {!cameraActive && (
                <div className="w-full aspect-video flex items-center justify-center bg-gray-900 text-gray-400">
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 animate-spin" />
                  ) : (
                    <VideoOff className="h-12 w-12" />
                  )}
                </div>
              )}
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {cameraActive ? 'Camera Active' : 'Camera Off'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">FPS:</span>
                    <span className="text-sm font-bold">{fps}</span>
                  </div>
                </div>

                <Button
                  onClick={toggleConnection}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : isConnected ? (
                    <>
                      <WifiOff className="h-4 w-4" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Check-In Status Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Check-In Status</h2>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 border-b border-red-100">
                {error}
              </div>
            )}

            <div className="p-6 flex flex-col items-center justify-center h-64">
              {checkInStatus === 'pending' ? (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Ready for Check-In</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please look at the camera to check in
                  </p>
                </div>
              ) : checkInStatus === 'success' ? (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Check-In Successful</h3>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    Welcome, {currentUser}!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    You have been successfully checked in
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Check-In Failed</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Could not verify your identity. Please try again.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h3>
              <div className="space-y-2">
                {results.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity</p>
                ) : (
                  results.slice(0, 3).map((result, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        result.status === 'Live' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">{result.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">How to Check In</h2>
          </div>
          <div className="p-4">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click "Connect" to start the system</li>
              <li>Allow camera access when prompted</li>
              <li>Look directly at the camera</li>
              <li>Make sure your face is well-lit and visible</li>
              <li>Wait for the system to recognize you</li>
              <li>You'll see a confirmation when check-in is complete</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}