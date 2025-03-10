import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  optionName:string = 'adminPanel';
  isUserAdmin:boolean = true;

  constructor(
    private eventService: EventemittersService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isUserAdmin = this.authService.isUserAdmin();
  }

  onSelectOption = (name) => this.optionName = name;

  //this function deals with the edit or add new plan options given over the plan list
  onChangePlan(e) {
    if((e.callType == 'plan' && e.type == 'add') || (e.callType == 'plan' && e.type == 'edit')) {
      this.optionName = 'addPlan';
    } else if((e.callType == 'user' && e.type == 'add') || (e.callType == 'user' && e.type == 'edit')) {
      this.optionName = 'userPanel';
    }
  }

  onChangePage(e) {
    this.optionName = e;
  }
}
