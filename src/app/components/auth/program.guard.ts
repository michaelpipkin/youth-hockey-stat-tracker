import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProgramService } from '@services/program.service';

export const groupGuard: CanActivateFn = () => {
  const programService = inject(ProgramService);
  const router = inject(Router);

  if (programService.currentProgram() === null) {
    router.navigate(['/programs']);
    return false;
  }
  return true;
};
