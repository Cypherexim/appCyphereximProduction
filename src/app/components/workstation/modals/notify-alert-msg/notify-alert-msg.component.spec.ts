import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotifyAlertMsgComponent } from './notify-alert-msg.component';

describe('NotifyAlertMsgComponent', () => {
  let component: NotifyAlertMsgComponent;
  let fixture: ComponentFixture<NotifyAlertMsgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotifyAlertMsgComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotifyAlertMsgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
