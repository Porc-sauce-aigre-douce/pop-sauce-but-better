import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private apiUrl = 'http://localhost:3000/';

  constructor(private http: HttpClient) { }

  getQuestions(): Observable<any> {
    return this.http.get(this.apiUrl + "questions", { withCredentials: true });
  }

  createQuestion(question: any): Observable<any> {
    return this.http.post(this.apiUrl + "question", question, { withCredentials: true });
  }

  updateQuestion(question: any): Observable<any> {
    return this.http.put(this.apiUrl + "question/" + question._id, question, { withCredentials: true });
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + "question/" + id, { withCredentials: true });
  }
}
