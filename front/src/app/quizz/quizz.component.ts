import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../services/question.service';

@Component({
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css']
})
export class QuizzComponent implements OnInit {
  question: any;

  constructor(private questionService: QuestionService) { }

  ngOnInit(): void {
    this.loadQuestion();
  }

  loadQuestion(): void {
    this.questionService.getQuestions().subscribe(
      (data) => {
        if (data && data.length > 0) {
          this.question = data[0]; // Suppose we want the first question
        }
      },
      (error) => {
        console.error('Failed to load questions', error);
      }
    );
  }
}
