import { CanActivateFn, Router } from '@angular/router';
import { QuestionService } from '../services/question.service';
import { inject } from '@angular/core';
import { catchError, tap } from 'rxjs';

export const isThereQuestionGuard: CanActivateFn = (route, state) => {
  const router: Router = inject(Router);
  return inject(QuestionService)
    .isthereQuestion()
    .pipe(tap((response) => {
      const isthereQuestion: boolean = response.isthere ? true : false;

      return isthereQuestion || router.navigate(['/']);
    }), catchError((error) => {
      console.error('Error checking if there is a question:', error);
      return router.navigate(['/']);
    }
    ));
};
