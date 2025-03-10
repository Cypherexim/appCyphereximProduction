import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyHunterComponent } from './company-hunter.component';

describe('CompanyHunterComponent', () => {
  let component: CompanyHunterComponent;
  let fixture: ComponentFixture<CompanyHunterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyHunterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyHunterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
