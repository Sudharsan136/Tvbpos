import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:5000'
    : 'http://10.0.2.2:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(API_URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
