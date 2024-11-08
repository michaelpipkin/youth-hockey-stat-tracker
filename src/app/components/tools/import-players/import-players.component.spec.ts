import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportPlayersComponent } from './import-players.component';

describe('ImportPlayersComponent', () => {
  let component: ImportPlayersComponent;
  let fixture: ComponentFixture<ImportPlayersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportPlayersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportPlayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
