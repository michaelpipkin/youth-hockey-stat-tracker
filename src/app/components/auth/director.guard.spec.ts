import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { directorGuard } from './director.guard';

describe('directorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => directorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
