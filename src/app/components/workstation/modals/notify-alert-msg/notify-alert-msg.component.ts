import { Component, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-notify-alert-msg',
  templateUrl: './notify-alert-msg.component.html',
  styleUrls: ['./notify-alert-msg.component.css']
})
export class NotifyAlertMsgComponent {
  constructor(public activeModal: NgbActiveModal) {}

  @Output() saveCallBack:EventEmitter<any> = new EventEmitter();

  alertMsg:string = "";

  onDismissModal = () => this.activeModal.dismiss('Cross click');
}
