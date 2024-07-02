import { Component } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { QuestionService } from '../services/question.service';

@Component({
  selector: 'app-hubroom',
  templateUrl: './hubroom.component.html',
  styleUrls: ['./hubroom.component.css'],
})
export class HubroomComponent {
  question: any;
  socket: any;
  rooms: any[] = [];
  roomName: string = '';
  isLoggedIn: boolean = false;
  isThereQuestion: boolean = false;

  constructor(
    private websocketService: WebsocketService,
    private router: Router,
    private authService: AuthService,
    private questionService: QuestionService
  ) {}

  ngOnInit(): void {
    this.socket = this.websocketService.connect();
    this.setEvents();

    this.authService.isLoggedIn().then((response) => {
      this.isLoggedIn = response.isLoggedIn;
    });

    this.questionService.isthereQuestion().subscribe((response) => {
      this.isThereQuestion = response.isThereQuestion;
    });
  }

  setEvents() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('roomList', ({ rooms }: any) => {
      this.rooms = [];
      for (const [key, value] of Object.entries(rooms)) {
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

  onCreateRoom(): void {
    this.router.navigate(['/room/', this.roomName]);
  }

  onLogout(): void {
    this.authService.logout().then(() => {
      location.reload();
    });
  }
}
