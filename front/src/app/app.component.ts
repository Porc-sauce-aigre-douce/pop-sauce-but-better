import { Component } from '@angular/core';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'pop-sauce-but-better';

  connected = '';
  socket = io('http://localhost:8080').on('connect', () => {
    this.connected = 'HELLO';
  });
}
