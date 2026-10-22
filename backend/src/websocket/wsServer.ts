import { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { WebSocketServerMessage } from '@energy/shared';
import { alarmService } from '../services/alarmService.js';
import { liveStore } from '../services/liveStore.js';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

export class WsServer {
  private wss: WebSocketServer | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        // Safe message handler: handle client ping/pong or ignore safely
        try {
          const str = data.toString();
          if (str === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          // Ignore malformed client messages
        }
      });

      ws.on('error', (err) => {
        console.warn('WebSocket client error:', err.message);
      });

      // Send initial full snapshot on connection
      const initialSnapshot: WebSocketServerMessage = {
        type: 'snapshot',
        payload: liveStore.getSystemSnapshot(),
      };
      this.sendSafe(ws, initialSnapshot);
    });

    // Listen to live events and broadcast to all connected clients
    liveStore.on('telemetry', (snapshot) => {
      this.broadcast({
        type: 'telemetry',
        payload: snapshot,
      });
    });

    liveStore.on('meter-status', (status) => {
      this.broadcast({
        type: 'meter-status',
        payload: status,
      });
    });

    alarmService.on('alarm', (alarm) => {
      this.broadcast({
        type: 'alarm',
        payload: alarm,
      });
    });

    // Heartbeat check every 30 seconds
    this.pingInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((client) => {
        const extWs = client as ExtendedWebSocket;
        if (!extWs.isAlive) {
          extWs.terminate();
          return;
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);

    console.log('📡 WebSocket server initialized on path /ws');
  }

  public broadcast(message: WebSocketServerMessage) {
    if (!this.wss) return;

    const payload = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload, (err) => {
          if (err) console.warn('WebSocket broadcast send error:', err.message);
        });
      }
    });
  }

  private sendSafe(ws: WebSocket, message: WebSocketServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message), (err) => {
        if (err) console.warn('WebSocket send error:', err.message);
      });
    }
  }

  public close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const wsServer = new WsServer();
