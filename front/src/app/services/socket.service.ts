import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    console.log('🔌 SocketService: Initializing...');
    
    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected! ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connect error:', error);
    });

    // Handle new request event
    this.socket.on('novi_zahtev', (data: any) => {
      console.log('📨 NOVI ZAHTEV PRIMLJEN:', data);
      this.showNotification(data);
    });
  }

  private showNotification(zahtev: any): void {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Novi zahtev za autora!', {
        body: `${zahtev.ime} (${zahtev.email}) želi da postane autor`,
        icon: 'assets/chef-icon.png'
      });
    }
    
    // Or show alert
    alert(`🆕 Novi zahtev za autora:\n${zahtev.ime}\n${zahtev.email}`);
  }

  // Public method to listen for new requests
  onNoviZahtev(callback: (data: any) => void): void {
    this.socket.on('novi_zahtev', callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}