import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterDataListComponent } from './filter-data-list.component';

describe('FilterDataListComponent', () => {
  let component: FilterDataListComponent;
  let fixture: ComponentFixture<FilterDataListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterDataListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterDataListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
