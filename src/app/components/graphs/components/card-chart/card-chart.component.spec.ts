import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardChartComponent } from './card-chart.component';

describe('CardChartComponent', () => {
  let component: CardChartComponent;
  let fixture: ComponentFixture<CardChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
