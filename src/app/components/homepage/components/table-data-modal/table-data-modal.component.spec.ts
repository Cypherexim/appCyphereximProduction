import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDataModalComponent } from './table-data-modal.component';

describe('TableDataModalComponent', () => {
  let component: TableDataModalComponent;
  let fixture: ComponentFixture<TableDataModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableDataModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableDataModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
