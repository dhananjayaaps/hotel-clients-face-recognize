'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Video, VideoOff, Wifi, WifiOff, CheckCircle2, XCircle, User, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/app/components/ui/Button';

interface Reservation {
  id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
}

interface FaceResult {
  name: string;
  email: string;
  status: 'Live' | 'Not Live';
  bbox: [number, number, number, number];
  reservations: Reservation[];
}

export default function CheckInPage() {
  const [results, setResults] = useState<FaceResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<FaceResult | null>(null);
  const [showReservations, setShowReservations] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connectWebSocket = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentUser(null);

    try {
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        setIsLoading(false);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/face`;
      wsRef.current = new WebSocket(wsUrl);

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

          handleDetection(data);
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleDetection = (faces: FaceResult[]) => {
    const validFace = faces.find(face =>
      face.status === 'Live' &&
      face.name !== 'Unknown' &&
      face.reservations &&
      face.reservations.length > 0
    );

    if (validFace && !currentUser) {
      // Found a user with reservations
      setCurrentUser(validFace);
      disconnect(); // Stop camera and websocket
      setShowReservations(true);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }

      streamRef.current = stream;

      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
      }

      cameraIntervalRef.current = setInterval(() => {
        sendFrame();
      }, 200);

      return true;
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Could not access camera. Please check permissions.');
      return false;
    }
  };

  const sendFrame = () => {
    if (!videoRef.current ||
      !captureCanvasRef.current ||
      !displayCanvasRef.current ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    displayCanvas.width = video.videoWidth;
    displayCanvas.height = video.videoHeight;

    const captureCtx = captureCanvas.getContext('2d');
    if (captureCtx) {
      captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

      captureCanvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(blob);
        }
      }, 'image/jpeg', 0.8);
    }

    const displayCtx = displayCanvas.getContext('2d');
    if (displayCtx) {
      displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
      drawResults(displayCtx, displayCanvas.width, displayCanvas.height);
    }
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

    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }

    setResults([]);
    setFps(0);
    setIsConnected(false);
    setCameraActive(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connectWebSocket();
    }
  };

  const getAuthToken = (): string => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    }
    throw new Error('Cannot access localStorage on server side');
  };

  const handleCheckIn = async (reservationId: string) => {
    if (!currentUser) return;

    setProcessing(true);
    setActionMessage('Processing check-in...');

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/reservations/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          email: currentUser.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check in');
      }

      setActionMessage('Check-in successful!');
      setTimeout(() => {
        setShowReservations(false);
        setCurrentUser(null);
        setProcessing(false);
        connectWebSocket(); // Restart the camera
      }, 2000);
    } catch (err) {
      console.error('Check-in error:', err);
      setActionMessage(err instanceof Error ? err.message : 'Check-in failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleCheckOut = async (reservationId: string) => {
    if (!currentUser) return;

    setProcessing(true);
    setActionMessage('Processing check-out...');

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/reservations/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          email: currentUser.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check out');
      }

      setActionMessage('Check-out successful!');
      setTimeout(() => {
        setShowReservations(false);
        setCurrentUser(null);
        setProcessing(false);
        connectWebSocket(); // Restart the camera
      }, 2000);
    } catch (err) {
      console.error('Check-out error:', err);
      setActionMessage(err instanceof Error ? err.message : 'Check-out failed. Please try again.');
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                ref={displayCanvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              <canvas ref={captureCanvasRef} className="hidden" />
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

          {/* Status Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 border-b border-red-100">
                {error}
              </div>
            )}

            <div className="p-6 flex flex-col items-center justify-center h-64">
              {currentUser ? (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Welcome, {currentUser.name}!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {currentUser.reservations.length} reservation(s) found
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    {isConnected ? (
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isConnected ? 'Scanning for faces...' : 'Ready to connect'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isConnected ? 'Looking for registered users' : 'Click connect to start'}
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
                      <div className={`h-2 w-2 rounded-full ${result.status === 'Live' ? 'bg-green-500' : 'bg-red-500'}`} />
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

        {/* Reservations Popup */}
        {showReservations && currentUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentUser.name}'s Reservations
                </h2>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </div>

              {actionMessage && (
                <div className={`p-3 ${actionMessage.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {actionMessage}
                </div>
              )}

              <div className="p-4">
                {currentUser.reservations.map((reservation) => (
                  <div key={reservation.id} className="mb-4 last:mb-0 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Room #{reservation.room_id.substring(0, 6)}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <div>Check-in: {formatDate(reservation.check_in_date)}</div>
                          <div>Check-out: {formatDate(reservation.check_out_date)}</div>
                          <div className="capitalize">Status: {reservation.status}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {reservation.status === 'active' && (
                          <Button
                            onClick={() => handleCheckIn(reservation.id)}
                            disabled={processing}
                            size="sm"
                            variant="outline"
                          >
                            Check In
                          </Button>
                        )}
                        {reservation.status === 'checked_in' && (
                          <Button
                            onClick={() => handleCheckOut(reservation.id)}
                            disabled={processing}
                            size="sm"
                            variant="outline"
                          >
                            Check Out
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end">
                <Button
                  onClick={() => {
                    setShowReservations(false);
                    setCurrentUser(null);
                    connectWebSocket();
                  }}
                  disabled={processing}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}