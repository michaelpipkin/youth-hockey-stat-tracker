import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsHelpComponent } from './tools-help.component';

describe('ToolsHelpComponent', () => {
  let component: ToolsHelpComponent;
  let fixture: ComponentFixture<ToolsHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsHelpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
