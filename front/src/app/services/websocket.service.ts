import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  wsUrl = "ws://localhost:3000";

  constructor() { }

  connect() {
    return io(this.wsUrl)
  }
}
