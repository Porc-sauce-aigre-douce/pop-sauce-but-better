import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { isThereQuestionGuard } from './is-there-question.guard';

describe('isThereQuestionGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => isThereQuestionGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
