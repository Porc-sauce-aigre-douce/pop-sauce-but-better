import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../services/question.service';
import { WebsocketService } from '../services/websocket.service';
import { ActivatedRoute } from '@angular/router';

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

  constructor(
    private websocketService: WebsocketService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.socket = this.websocketService.connect();
    this.roomName = this.activatedRoute.snapshot.params['id'];
    this.setEvents();
  }

  setEvents() {
    console.log(this.roomName);
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('question', ({ question }: any) => {
      this.answer = undefined;
      this.question = question[0];
      console.log(question[0]);
      this.answerState = AnswerState.NOTANSWERED;
      console.log(this.answerState);
    });
    this.socket.on('answer', ({answer}: any) => {
      console.log(answer);
      this.answer = answer;
    });
    this.socket.on('correctAnswer', () => {
      console.log('correct');
      this.answerState = AnswerState.CORRECT;
      console.log(this.answerState);
    });
    this.socket.on('incorrectAnswer', () => {
      console.log('incorrect');
      this.answerState = AnswerState.INCORRECT;});
    this.socket.on('roomUsers', this.onRoomUsers);
    this.socket.on('roomCreated', (roomName: string) => {
      console.log(roomName);
      // this.socket.emit('joinRoom', roomName);
    });
    this.socket.on('roomList', (roomList: any) => {
      console.log(roomList);
      // console.log(this.socket);
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
        this.socket.emit('startQuiz', { roomName: this.roomName });
        return;
      }
      console.log(message);
    });
    // this.socket.onAny((event: any, ...args: any[]) => {
    //   console.log(this.socket);
    //   console.log(event, args);
    // });
    console.log(this.socket);
  }

  onConnect(): void {}

  onDisconnect(): void {
    console.log('disconnected');
  }

  onRoomUsers(users: any): void {
    console.log(users);
    this.users = users;
  }

  isQuestionLoaded(): boolean {
    return this.question !== undefined;
  }

  answerQuestion(answer: string): void {
    this.socket.emit('submitAnswer', { userAnswer: answer });
  }
}
