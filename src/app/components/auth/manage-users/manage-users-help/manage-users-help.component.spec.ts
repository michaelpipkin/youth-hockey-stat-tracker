import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersHelpComponent } from './manage-users-help.component';

describe('ManageUsersHelpComponent', () => {
  let component: ManageUsersHelpComponent;
  let fixture: ComponentFixture<ManageUsersHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageUsersHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageUsersHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
