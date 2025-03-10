import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatorModalComponent } from './locator-modal.component';

describe('LocatorModalComponent', () => {
  let component: LocatorModalComponent;
  let fixture: ComponentFixture<LocatorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocatorModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocatorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
