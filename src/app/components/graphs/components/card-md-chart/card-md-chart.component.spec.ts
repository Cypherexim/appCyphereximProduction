import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMdChartComponent } from './card-md-chart.component';

describe('CardMdChartComponent', () => {
  let component: CardMdChartComponent;
  let fixture: ComponentFixture<CardMdChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardMdChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardMdChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
