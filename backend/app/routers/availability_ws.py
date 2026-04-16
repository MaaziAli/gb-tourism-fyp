from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.connection_manager import manager

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/availability/{listing_id}")
async def availability_websocket(listing_id: int, websocket: WebSocket):
    """
    WebSocket channel for real-time availability updates.
    Client connects to ws:///ws/availability/{listing_id}
    and receives JSON push messages when that listing's availability changes.
    """
    await manager.connect(listing_id, websocket)
    try:
        while True:
            # Keep connection alive — we only push from server,
            # client can send ping text to keep alive
            data = await websocket.receive_text()
            # Ignore any incoming client messages (we only push)
    except WebSocketDisconnect:
        manager.disconnect(listing_id, websocket)
    except Exception:
        manager.disconnect(listing_id, websocket)
