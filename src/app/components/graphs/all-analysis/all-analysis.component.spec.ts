import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAnalysisComponent } from './all-analysis.component';

describe('AllAnalysisComponent', () => {
  let component: AllAnalysisComponent;
  let fixture: ComponentFixture<AllAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllAnalysisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
