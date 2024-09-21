import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPlayerComponent } from './add-player.component';

describe('CreatePlayerComponent', () => {
  let component: AddPlayerComponent;
  let fixture: ComponentFixture<AddPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
