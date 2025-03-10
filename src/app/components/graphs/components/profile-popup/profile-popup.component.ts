import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-profile-popup',
  templateUrl: './profile-popup.component.html',
  styleUrls: ['./profile-popup.component.css']
})
export class ProfilePopupComponent {
  constructor(public activeModal: NgbActiveModal) {}

  popupHeading:string = "table heading";

  setDataToGrid() {}
}
