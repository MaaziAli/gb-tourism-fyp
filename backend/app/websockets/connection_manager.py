from fastapi import WebSocket
from collections import defaultdict
import asyncio
import json

class ConnectionManager:
    def __init__(self):
        # listing_id (int) -> set of active WebSocket connections
        self._channels: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, listing_id: int, websocket: WebSocket):
        await websocket.accept()
        self._channels[listing_id].add(websocket)

    def disconnect(self, listing_id: int, websocket: WebSocket):
        self._channels[listing_id].discard(websocket)
        if not self._channels[listing_id]:
            del self._channels[listing_id]

    async def broadcast(self, listing_id: int, message: dict):
        """Send a JSON message to every client watching listing_id."""
        dead: list[WebSocket] = []
        for ws in list(self._channels.get(listing_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(listing_id, ws)

# Singleton instance — import this everywhere
manager = ConnectionManager()
