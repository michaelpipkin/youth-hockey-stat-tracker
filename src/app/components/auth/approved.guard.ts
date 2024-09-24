import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '@services/user.service';

export const approvedGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!userService.isApproved()) {
    router.navigate(['/profile']);
    return false;
  }
  return true;
};
