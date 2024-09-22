import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { programGuard } from './program.guard';

describe('programGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => programGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
