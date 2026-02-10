// socket.service.ts - mora postojati
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
  }

  onNoviZahtev(callback: (data: any) => void) {
    this.socket.on('novi_zahtev', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}