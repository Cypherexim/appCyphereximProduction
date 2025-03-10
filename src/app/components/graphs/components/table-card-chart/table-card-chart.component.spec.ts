import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCardChartComponent } from './table-card-chart.component';

describe('TableCardChartComponent', () => {
  let component: TableCardChartComponent;
  let fixture: ComponentFixture<TableCardChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableCardChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCardChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
