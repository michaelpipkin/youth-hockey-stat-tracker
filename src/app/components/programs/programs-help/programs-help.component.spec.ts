import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramsHelpComponent } from './programs-help.component';

describe('ProgramsHelpComponent', () => {
  let component: ProgramsHelpComponent;
  let fixture: ComponentFixture<ProgramsHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramsHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
