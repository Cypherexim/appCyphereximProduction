import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidefilterComponent } from './sidefilter.component';

describe('SidefilterComponent', () => {
  let component: SidefilterComponent;
  let fixture: ComponentFixture<SidefilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidefilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidefilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
