import { Component } from '@angular/core';
import { QuestionService } from '../services/question.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-back-office',
  templateUrl: './back-office.component.html',
  styleUrls: ['./back-office.component.css']
})
export class BackOfficeComponent {

  questions: any[] = [];
  selectedQuestion: any = null;
  createFormVisible: boolean = false;

  createForm: FormGroup = new FormGroup({
    wording: new FormControl('', Validators.required),
    answer1: new FormControl('', Validators.required),
    answer2: new FormControl('', Validators.required),
    answer3: new FormControl('', Validators.required),
    answer4: new FormControl('', Validators.required),
    correctAnswer: new FormControl('', Validators.required)
  });

  editForm: FormGroup = new FormGroup({
    wording: new FormControl(''),
    answer1: new FormControl(''),
    answer2: new FormControl(''),
    answer3: new FormControl(''),
    answer4: new FormControl(''),
    correctAnswer: new FormControl('')
  });

  constructor(private questionService: QuestionService) { }


  ngOnInit(): void {
    this.getQuestions();
  }

  getQuestions(): void {
    this.questionService.getQuestions().subscribe(
      (response: any) => {
        this.questions = response;
      },
      (error: any) => {
        console.error('Error retrieving questions:', error);
      }
    );
  }

  createQuestion(): void {
    if (!this.createForm.valid) {
      console.error('Invalid form');
      return;
    }
    const question = {
      wording: this.createForm.get('wording')?.value,
      answers: [
        this.createForm.get('answer1')?.value,
        this.createForm.get('answer2')?.value,
        this.createForm.get('answer3')?.value,
        this.createForm.get('answer4')?.value
      ],
      correctAnswers: [""]
    };
    question.correctAnswers = [question.answers[this.createForm.get('correctAnswer')?.value]];
    this.questionService.createQuestion(question).subscribe(
      (response: any) => {
        console.log('Question created successfully:', response);
        this.getQuestions();
      },
      (error: any) => {
        console.error('Error creating question:', error);
      }
    );
  }

  updateQuestion(question: any): void {
    // if (!this.editForm.valid) {
    //   console.error('Invalid form');
    //   return;
    // }
    question.wording = this.editForm.get('wording')?.value ? this.editForm.get('wording')?.value : this.selectedQuestion.wording;
    question.answers[0] = this.editForm.get('answer1')?.value ? this.editForm.get('answer1')?.value : this.selectedQuestion.answers[0];
    question.answers[1] = this.editForm.get('answer2')?.value ? this.editForm.get('answer2')?.value : this.selectedQuestion.answers[1];
    question.answers[2] = this.editForm.get('answer3')?.value ? this.editForm.get('answer3')?.value : this.selectedQuestion.answers[2];
    question.answers[3] = this.editForm.get('answer4')?.value ? this.editForm.get('answer4')?.value : this.selectedQuestion.answers[3];
    question.correctAnswers = this.editForm.get('correctAnswer')?.value ? [question.answers[this.editForm.get('correctAnswer')?.value]] : this.selectedQuestion.correctAnswers;
    this.questionService.updateQuestion(question).subscribe(
      (response: any) => {
        console.log('Question updated successfully:', response);
        this.getQuestions();
      },
      (error: any) => {
        console.error('Error updating question:', error);
      }
    );
  }

  deleteQuestion(questionId: number): void {
    this.questionService.deleteQuestion(questionId).subscribe(
      (response: any) => {
        console.log('Question deleted successfully:', response);
        this.getQuestions();
      },
      (error: any) => {
        console.error('Error deleting question:', error);
      }
    );
  }

  selectQuestion(question: any): void {
    this.selectedQuestion = question;
  }

  showCreateForm(): void {
    this.createFormVisible = !this.createFormVisible;
  }

  onEditCorrectAnswerValueChange(event: any) {
    this.editForm.get('correctAnswer')?.setValue(event.target.value);
  }
  
  onCreateCorrectAnswerValueChange(event: any) {
    this.createForm.get('correctAnswer')?.setValue(event.target.value);
  }
}
