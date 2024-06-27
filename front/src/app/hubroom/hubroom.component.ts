import { Component } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';

@Component({
  selector: 'app-hubroom',
  templateUrl: './hubroom.component.html',
  styleUrls: ['./hubroom.component.css'],
})
export class HubroomComponent {
  question: any;
  socket: any;
  rooms: any[] = [];

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.socket = this.websocketService.connect();
    this.setEvents();
  }

  setEvents() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('roomList', ({ rooms }: any) => {
      this.rooms = [];
      for (const [key, value] of Object.entries(rooms)) {
        console.log(value);
        if (typeof value === 'object') {
          this.rooms.push({ ...value, roomName: key });
        }
      }
    });
    this.socket.on('connect_error', (err: any) => {
      console.log(`connect_error due to ${err.message}`);
    });
    this.socket.on('error', (error: any) => {
      console.log(error.name + ' ' + error.text + ' ' + error.time);
    });
  }

  onConnect(): void {}

  onDisconnect(): void {
    console.log('disconnected');
  }

  getUserNumberInRoom(room: any) {
    return room.users.length;
  }
}
