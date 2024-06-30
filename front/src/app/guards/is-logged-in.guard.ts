import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const isLoggedInGuard: CanActivateFn = (route, state) => {
  const router: Router = inject(Router);
  return inject(AuthService)
    .getUser()
    .then((response) => {
      const isLoggedIn: boolean = response ? true : false;

      return isLoggedIn || router.navigate(['/']);
    });
};
