import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Poveži se na Flask Socket.IO server
    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
  }

  // Slušaj nove zahteve
  onNoviZahtev(callback: (data: any) => void) {
    this.socket.on('novi_zahtev', callback);
  }

  // Diskonektuj
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}