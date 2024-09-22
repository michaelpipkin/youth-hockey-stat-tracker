import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamsHelpComponent } from './teams-help.component';

describe('TeamsHelpComponent', () => {
  let component: TeamsHelpComponent;
  let fixture: ComponentFixture<TeamsHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamsHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
