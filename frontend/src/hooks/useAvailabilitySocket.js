import { useEffect, useRef, useCallback } from 'react';

/**
 * useAvailabilitySocket(listingId, onUpdate)
 *
 * Opens a WebSocket to ws(s):///ws/availability/{listingId}.
 * Calls onUpdate(message) whenever the server pushes an availability update.
 * Automatically reconnects once if the connection drops unexpectedly.
 * Cleans up on component unmount.
 *
 * @param {number|string} listingId  - The listing to watch
 * @param {function} onUpdate        - Callback called with parsed JSON message
 */
export function useAvailabilitySocket(listingId, onUpdate) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const isMounted = useRef(true);

  // Derive WS base URL from the Vite env variable or fall back to localhost
  const getWsUrl = useCallback(() => {
    const httpBase =
      import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBase = httpBase.replace(/^http/, 'ws');
    return `${wsBase}/ws/availability/${listingId}`;
  }, [listingId]);

  const connect = useCallback(() => {
    if (!listingId) return;
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WS] Connected to availability channel for listing ${listingId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'availability_updated' && isMounted.current) {
          onUpdate(data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      // Errors are handled by onclose
    };

    ws.onclose = (event) => {
      // Reconnect once after 3 seconds if closed unexpectedly (not by us)
      if (isMounted.current && event.code !== 1000) {
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, 3000);
      }
    };
  }, [listingId, getWsUrl, onUpdate]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);
}
