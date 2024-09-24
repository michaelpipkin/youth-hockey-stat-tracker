import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { approvedGuard } from './approved.guard';

describe('approvedGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => approvedGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
