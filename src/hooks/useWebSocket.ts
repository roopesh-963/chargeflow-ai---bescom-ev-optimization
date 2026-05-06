import { useEffect, useRef, useState } from 'react';

export function useWebSocket<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    shouldReconnectRef.current = true;

    function connect() {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as T;
          setData(parsed);
        } catch {
          setError('Failed to parse live update payload');
        }
      };

      socket.onerror = () => {
        setError('WebSocket connection error');
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (!shouldReconnectRef.current) return;
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
        socketRef.current.close();
      }
    };
  }, [url]);

  return { data, isConnected, error };
}
