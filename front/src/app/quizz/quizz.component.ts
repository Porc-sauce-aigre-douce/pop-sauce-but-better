import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { ActivatedRoute, Router } from '@angular/router';

enum AnswerState {
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  NOTANSWERED = 'notAnswered',
}

@Component({
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css'],
})
export class QuizzComponent implements OnInit {
  readonly AnswerState = AnswerState;
  question: any;
  socket: any;
  users: any;
  answerState: AnswerState = AnswerState.NOTANSWERED;
  answer: any;
  roomName: string = '';
  isReady: boolean = false;
  isQuizStarted: boolean = false;

  constructor(
    private websocketService: WebsocketService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.socket = this.websocketService.connect();
    this.roomName = this.activatedRoute.snapshot.params['id'];
    this.setEvents();
  }

  setEvents() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('question', ({ question }: any) => {
      this.answer = undefined;
      this.question = question;
      this.answerState = AnswerState.NOTANSWERED;
    });
    this.socket.on('answer', ({ answer }: any) => {
      this.answer = answer;
    });
    this.socket.on('correctAnswer', () => {
      this.answerState = AnswerState.CORRECT;
    });
    this.socket.on('incorrectAnswer', () => {
      this.answerState = AnswerState.INCORRECT;
    });
    this.socket.on('roomUsers', ({ users, isQuizStarted }: any) => {
      this.users = users;
      this.isQuizStarted = isQuizStarted;
    });
    this.socket.on('userList', ({ users }: any) => {
      console.log(users);
      this.users = users;
    });
    this.socket.on('roomCreated', (roomName: string) => {});
    this.socket.on('roomList', (roomList: any) => {
      this.socket.emit('createRoom', { roomName: this.roomName });
    });
    this.socket.on('connect_error', (err: any) => {
      console.log(`connect_error due to ${err.message}`);
    });
    this.socket.on('error', (error: any) => {
      if (error.text === `Room ${this.roomName} already exists`) {
        this.socket.emit('joinRoom', { roomName: this.roomName });
        return;
      }
      console.log(error.name + ' ' + error.text + ' ' + error.time);
    });
    this.socket.on('message', (message: any) => {
      if (message.text === `You joined the room ${this.roomName}`) {
        if (!this.isQuizStarted) {
          this.socket.emit('startQuiz', { roomName: this.roomName });
          this.isQuizStarted = true;
        }
        return;
      }
    });
  }

  onConnect(): void {}

  onDisconnect(): void {
    console.log('disconnected');
  }

  isQuestionLoaded(): boolean {
    return this.question !== undefined;
  }

  answerQuestion(answer: string): void {
    this.socket.emit('submitAnswer', { userAnswer: answer, roomName: this.roomName });
  }

  onHubButton(): void {
    this.socket.emit('quitRoom', { roomName: this.roomName });
    this.router.navigate(['/']);
  }
}
