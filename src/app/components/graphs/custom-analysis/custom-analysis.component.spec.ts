import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomAnalysisComponent } from './custom-analysis.component';

describe('CustomAnalysisComponent', () => {
  let component: CustomAnalysisComponent;
  let fixture: ComponentFixture<CustomAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomAnalysisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
