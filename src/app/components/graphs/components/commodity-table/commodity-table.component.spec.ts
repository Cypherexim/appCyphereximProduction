import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommodityTableComponent } from './commodity-table.component';

describe('CommodityTableComponent', () => {
  let component: CommodityTableComponent;
  let fixture: ComponentFixture<CommodityTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommodityTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommodityTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
