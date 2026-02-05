import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { ApiMsgRes } from 'src/app/models/api.types';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';
import { DatePipe } from '@angular/common';

@Component({
	selector: 'notification-modal-content',
	standalone: true,
	template: `<div class="modal-box">
    <div class="modal-header bg-white sticky-top"><i class="fa-sharp fa-solid fa-rectangle-xmark" (click)="onClickCloseModal()"></i></div>
    <div class="modal-content">
      <div class="company-img">
        <img src="assets/images/Title3.png" alt="company-image"/>
        <p>{{dateTime | date:'EEEE, MMMM d, y, h:mm a'}}</p>
      </div>
      <div class="content" [innerHTML]="content"></div>
    </div>
  </div>`,
  imports: [DatePipe]
})
export class NgbdModalContent {
	activeModal = inject(NgbActiveModal);
	@Input() content: any;
  @Input() dateTime: string;
  @Output() onCloseEvent:EventEmitter<Boolean> = new EventEmitter();
  
  onClickCloseModal() {
    this.onCloseEvent.emit(true);
    this.activeModal.close('Close click');
  }
}



@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy{
  constructor(
    private apiService: ApiServiceService,
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService,
    public ellipsePipe: EllipsisPipe,
    private eventService: EventemittersService
  ) {}

  // apiSubscription:Subscription;
  eventSubscription:Subscription;
  eventSubscription2:Subscription;
  notificationArr:any[] = [];
  copyNotificationArr:any[] = [];
  unseenIDs:string[] = [];
  isLoading:boolean = true;
  hasNotificationBegan:boolean = false;


  ngOnInit(): void {
    // this.eventService.vanishNotificationCount.next(true);
    this.getAllNotification();
  }

  ngOnDestroy(): void {
    this.eventSubscription?.unsubscribe();
    this.eventSubscription2?.unsubscribe();
    // this.apiSubscription?.unsubscribe();
  }

  getAllNotification() {
    this.notificationArr = [];
    // this.copyNotificationArr = [];

    this.eventSubscription = this.eventService.sendNotifications.subscribe({
      next: (resultArr:any[]) => {
        this.isLoading = false;
        this.notificationArr = resultArr;
        this.notificationRefreshProcess();
      }, error: (err:any) => console.error(err)
    });
  }

  notificationRefreshProcess() {
    const arrLen = this.notificationArr.length;
    const preferenceInObj = this.getuserPreference();
    if(!preferenceInObj.hasOwnProperty("notification")) preferenceInObj["notification"] = [];

    for(let i=0; i<arrLen; i++) {
      const doesExist = (preferenceInObj["notification"]).includes(Number(this.notificationArr[i]["Id"]));
      const notificationMessage = this.notificationArr[i]["message"];
      this.notificationArr[i]["message"] = typeof notificationMessage=="string" ? JSON.parse(notificationMessage) : notificationMessage;

      if(this.hasNotificationBegan) {
        const filteredArr = this.copyNotificationArr.filter((item:any) => item.Id == this.notificationArr[i]["Id"]);
        if(filteredArr.length==0) {
          const newNotification = JSON.parse(JSON.stringify(this.notificationArr[i]));
          newNotification["doesExist"] = doesExist;
          newNotification["message"]["msg"] = this.ellipsePipe.transform(newNotification["message"]["msg"], 50);
          this.copyNotificationArr.unshift(newNotification);
        }
      } else {
        this.copyNotificationArr.push(JSON.parse(JSON.stringify(this.notificationArr[i])));
        this.copyNotificationArr[i]["message"]["msg"] = this.ellipsePipe.transform(this.copyNotificationArr[i]["message"]["msg"], 50);            
        this.copyNotificationArr[i]["doesExist"] = doesExist;
      }
    }
    this.hasNotificationBegan = true;
  }

  // expandMsg(elem1:HTMLSpanElement, elem2Id:string, id:string) {
  //   const divTag = document.getElementById(elem2Id) as HTMLDivElement;
  //   const isReadMoreTxt = elem1.innerText == "Read more";
    
  //   elem1.innerText = isReadMoreTxt ? "Read less": "Read more";
  //   divTag.style.maxHeight = isReadMoreTxt ? "100%": "20%";
  //   this.applyEllipses(isReadMoreTxt ? "expand": "shrink", id);
  // }

  applyEllipses(type:string, id:string) {
    this.copyNotificationArr.map((item:any, index:number) => {
      if(item?.Id == id) {
        if(type == "expand") item["message"]["msg"] = this.notificationArr[index]["message"]["msg"];
        else item["message"]["msg"] = this.ellipsePipe.transform(item["message"]["msg"], 50);
      }
    });
  }

  onClickNotifyMsg(id:string|number) {
    let allSeenIds = [];
    const selectedNotification = this.notificationArr.filter((item:any) => item?.Id == id);
    const preferenceInObj = this.getuserPreference();
    if(preferenceInObj.hasOwnProperty("notification")) {
      allSeenIds = preferenceInObj["notification"];
      if(!allSeenIds.includes(Number(id))) allSeenIds.push(Number(id));
    } else { allSeenIds = [Number(id)]; }

    this.setToUserPrefAPI(allSeenIds);
    if(selectedNotification.length>0) this.onOpenMessageModal(selectedNotification[0]);
  }

  setToUserPrefAPI(ids:any[]) {
    // const userPreference = (this.authService.getUserDetails())["userPreference"];
    const preferenceInObj = this.getuserPreference();
    preferenceInObj["notification"] = ids;
    const stringyPrefs = JSON.stringify(preferenceInObj);

    this.userService.updateUserPereference(stringyPrefs).subscribe({
      next: (res:any) => {
        const currentUserData = this.authService.getUserDetails();
        currentUserData["userPreference"] = stringyPrefs;
        window.localStorage.setItem("currentUser", JSON.stringify(currentUserData));
      }, error: (err) => {console.log(err)}
    });
  }

  getuserPreference() {
    const userPreference = (this.authService.getUserDetails())["userPreference"];
    return userPreference!=null ? JSON.parse(userPreference) : {};
  }

  onOpenMessageModal(notification:any) {
    const modalRef = this.modalService.open(NgbdModalContent, { 
      windowClass: "notification-msg",
      centered: true,
      keyboard: false,
      size: "lg"
    });
    modalRef.componentInstance.content = notification["message"]["msg"];
    modalRef.componentInstance.dateTime = notification["created_date"];
    this.eventSubscription2 = modalRef.componentInstance.onCloseEvent.subscribe({
      next: (res:boolean) => this.notificationRefreshProcess(), 
      error: (err:any) => console.log(err)
    });
  }
}

