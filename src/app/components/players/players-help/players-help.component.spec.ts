import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayersHelpComponent } from './players-help.component';

describe('PlayersHelpComponent', () => {
  let component: PlayersHelpComponent;
  let fixture: ComponentFixture<PlayersHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayersHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayersHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
