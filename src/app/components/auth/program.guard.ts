import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProgramService } from '@services/program.service';

export const programGuard: CanActivateFn = () => {
  const programService = inject(ProgramService);
  const router = inject(Router);

  if (programService.activeUserProgram() === null) {
    router.navigate(['/programs']);
    return false;
  }
  return true;
};
