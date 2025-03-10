import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-user-alert-modal',
  templateUrl: './user-alert-modal.component.html',
  styleUrls: ['./user-alert-modal.component.css']
})
export class UserAlertModalComponent {
  alertMsg:string = "";
  
  constructor(private activeModal: NgbActiveModal) {}

  closeModal() {
    this.activeModal.dismiss('Cross click');
  }
}
