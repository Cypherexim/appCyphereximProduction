import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationPasswordComponent } from './notification-password.component';

describe('NotificationPasswordComponent', () => {
  let component: NotificationPasswordComponent;
  let fixture: ComponentFixture<NotificationPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationPasswordComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
