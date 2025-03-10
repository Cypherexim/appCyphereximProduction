import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAlertModalComponent } from './user-alert-modal.component';

describe('UserAlertModalComponent', () => {
  let component: UserAlertModalComponent;
  let fixture: ComponentFixture<UserAlertModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserAlertModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAlertModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
