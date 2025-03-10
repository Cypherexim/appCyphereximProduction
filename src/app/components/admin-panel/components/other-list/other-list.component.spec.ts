import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherListComponent } from './other-list.component';

describe('OtherListComponent', () => {
  let component: OtherListComponent;
  let fixture: ComponentFixture<OtherListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OtherListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtherListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
