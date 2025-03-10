import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanTemplateComponent } from './plan-template.component';

describe('PlanTemplateComponent', () => {
  let component: PlanTemplateComponent;
  let fixture: ComponentFixture<PlanTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanTemplateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
