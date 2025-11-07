import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, Subscription } from 'rxjs';
import { DownloadModelComponent } from 'src/app/components/homepage/components/download-model/download-model.component';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-notification-password',
  templateUrl: './notification-password.component.html',
  styleUrls: ['./notification-password.component.css']
})
export class NotificationPasswordComponent implements OnInit{
  constructor(
    private userService: UserService,
    private modalService: NgbModal,
    private alertService: AlertifyService,
    private apiService: ApiServiceService
  ) {
    this.searchControl.valueChanges.pipe(debounceTime(800)).subscribe({
      next: (text:string) => {
        this.searchInp = text;
        this.contactFilter();
      }, error: (err:any) => console.log(err)
    })
  }

  @Input() pageType:string = "";
  
  searchControl:FormControl = new FormControl();
  searchInp:string = "";
  heading:string = "";
  apiSubscription:Subscription;
  isEmailDropdownOn:boolean = false;
  allusers:string[] = [];
  copyAllUsers:string[] = [];
  selectedItemArr:string[] = [];

  notificationPageType:string = "alert";

  dates = {start: "", end: ""};
  message = {alert: "", push: ""};
  marqueeMsg = "";
  showPopup:boolean = true;
  showBanner:boolean = true;
  isSubmitClicked:boolean = false;
  notificationType:string = "normal";

  ngOnInit(): void {
    this.apiSubscription = this.userService.getAllUser().subscribe((res:any) => {
      if(!res.error) { 
        const userList = res?.results;
        for(let i=0; i<userList.length; i++) {
          this.allusers.push(userList[i]["Email"]);
          if(i == userList.length-1) this.copyAllUsers = [...this.allusers];
        }
      }
    });
  }

  onSelectEmail(item:string) {
    this.isEmailDropdownOn = false;
    this.selectedItemArr = [item];
    this.searchInp = "";
  }

  contactFilter() {
    const txtLen = this.searchInp.length;
    this.copyAllUsers = this.allusers.filter(item => this.searchInp.toLowerCase() == (item.substring(0, txtLen)).toLowerCase());
  }

  onClickTab(elem:HTMLDivElement, elem2:HTMLDivElement) {
    elem.classList.add("active-tab");
    elem2.classList.remove("active-tab");
    
    if(this.notificationPageType == "alert") this.notificationPageType = "push";
    else this.notificationPageType = "alert";
  }

  onTypeEditor(event:any, type:string) {
    if(type == "alert") {
      this.message.alert = event.target.innerHTML;
      this.marqueeMsg = event.target.textContent;
    } else this.message.push = event.target.innerHTML;
  }

  onSubmitNotification(notificationElem:HTMLDivElement) {
    const msgJson = JSON.stringify({
      type: this.notificationType, 
      msg: this.message.push, 
      heading: this.heading
    });
    this.apiService.AddNewNotification({message: msgJson}).subscribe({
      next: (res:any) => {
        if(!res.error) {
          this.message.push = "";
          this.heading = "";
          this.notificationType = "";
          notificationElem.innerHTML = "";
          this.alertService.success("Notification has been sent successfully!");
        }
      }, error: (err) => {}
    });
  }

  onSubmitAlertMsg(elem:HTMLDivElement) {
    this.isSubmitClicked = true;     
    const apiObj = {
      id: 1,
      startDate: `${this.dates.start} 00:00:00`,
      endDate: `${this.dates.end} 23:59:59`,
      message: JSON.stringify({popup: this.message.alert, marquee: this.marqueeMsg}),
      showPopup: this.showPopup,
      showBanner: this.showBanner,
    };
    
    this.apiService.updateLastAlertMsg(apiObj).subscribe({
      next: (res:any) => {
        this.isSubmitClicked = false;
        if(!res.error) {
          this.alertService.success("New Alert Message Added");
          this.dates = {start: "", end: ""};
          this.message.alert = "";
          this.showPopup = true;
          this.showBanner = true;
          elem.innerHTML = "";
        }
      },
      error: () => {this.isSubmitClicked = false;}
    });
  }

  onSubmitResetPass() {
    this.isSubmitClicked = true;
    this.apiService.setDefaultUserPassword(this.selectedItemArr[0]).subscribe({
      next: (res:any) => {
        if(!res.error) {
          this.isSubmitClicked = false;
          this.selectedItemArr = [];
          this.copyAllUsers = [...this.allusers];
          const modalRef2 = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'downloadModalClass', centered: true });
          (<DownloadModelComponent>modalRef2.componentInstance).modalType = "password-msg";
          (<DownloadModelComponent>modalRef2.componentInstance).customMsg = 'User password has been changed successfully!';
        }
      },
      error: () => {}
    });
  }
}
