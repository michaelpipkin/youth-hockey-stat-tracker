import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationsHelpComponent } from './evaluations-help.component';

describe('EvaluationsHelpComponent', () => {
  let component: EvaluationsHelpComponent;
  let fixture: ComponentFixture<EvaluationsHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationsHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
