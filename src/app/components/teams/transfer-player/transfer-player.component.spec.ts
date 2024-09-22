import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovePlayerTeamComponent } from './transfer-player.component';


describe('MovePlayerTeamComponent', () => {
  let component: MovePlayerTeamComponent;
  let fixture: ComponentFixture<MovePlayerTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovePlayerTeamComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MovePlayerTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
