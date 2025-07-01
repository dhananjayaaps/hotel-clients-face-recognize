// app/components/FaceRecognition.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';

interface FaceResult {
  name: string;
  status: 'Live' | 'Not Live';
  bbox: [number, number, number, number];
}

export default function FaceRecognition() {
  const [results, setResults] = useState<FaceResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const connectWebSocket = () => {
    setIsLoading(true);
    setError(null);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    wsRef.current = new WebSocket(`${protocol}//${host}/ws`);

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setIsLoading(false);
      startCamera();
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data: FaceResult[] = JSON.parse(event.data);
        setResults(data);
        frameCountRef.current += 1;
        
        // Calculate FPS
        const now = performance.now();
        if (now - lastFpsUpdateRef.current > 1000) {
          setFps(Math.round(frameCountRef.current * 1000 / (now - lastFpsUpdateRef.current)));
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket Error:', err);
      setError('Connection error. Please try again.');
      setIsLoading(false);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'user' 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      streamRef.current = stream;
      processVideo();
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Could not access camera. Please check permissions.');
      setIsLoading(false);
      if (wsRef.current) {
        wsRef.current.close();
      }
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
      
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Send frame to WebSocket
      canvas.toBlob((blob) => {
        if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then(buf => {
            wsRef.current?.send(buf);
          });
        }
      }, 'image/jpeg', 0.8);
      
      // Draw bounding boxes and labels
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
      
      // Draw bounding box
      ctx.strokeStyle = status === 'Live' ? '#00FF00' : '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, right - left, bottom - top);
      
      // Draw label background
      ctx.fillStyle = status === 'Live' ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      const textWidth = ctx.measureText(`${name} (${status})`).width;
      ctx.fillRect(left, top - 25, Math.max(textWidth + 10, right - left), 25);
      
      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(`${name} (${status})`, left + 5, top - 7);
    });
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setResults([]);
    setFps(0);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Face Recognition</h2>
      
      <div className="relative mb-4">
        <video 
          ref={videoRef} 
          className="rounded-lg border-2 border-gray-300 bg-black"
          width="640"
          height="480"
          muted
          playsInline
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 rounded-lg pointer-events-none"
          width="640"
          height="480"
        />
      </div>
      
      <div className="flex gap-4 mb-4">
        {!isConnected ? (
          <Button 
            onClick={connectWebSocket} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : 'Start Recognition'}
          </Button>
        ) : (
          <Button 
            onClick={disconnect}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Stop Recognition
          </Button>
        )}
      </div>
      
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Status: </span>
          <span className={`font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">FPS: </span>
          <span className="font-bold">{fps}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">Detected Faces: </span>
          <span className="font-bold">{results.length}</span>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-2">Detection Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-md ${result.status === 'Live' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{result.name}</span>
                    <span className={`font-bold ${result.status === 'Live' ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Position: [{result.bbox.join(', ')}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}