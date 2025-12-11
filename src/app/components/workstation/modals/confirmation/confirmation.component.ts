import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { ApiMsgRes } from 'src/app/models/api.types';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {

  @Output() callBack:EventEmitter<boolean> = new EventEmitter<boolean>();

  confirmationMsg:string = 'Are you sure to delete this data?';
  dataId:string = '';
  deleteType:string = 'favourite';
  currentPopUp:string = "confirmation";

  allUsers:any[] = [];
  copyAllUsers:any[] = [];
  downloadingIDsList:string[] = [];
  downloadWorkspaceId:any[] = [];
  selectedUserId:any[] = [];
  hasSubmitted:boolean = false;
  hasSharedLink:boolean = false;
  searchInp:string = "";
  selectedEmailArr:string[] = [];
  dropdownVisibility:boolean = false;
  isSelectAll:boolean = false;

  shareLinkOptions = {toPortal: false, toEmail: true};
  selectedEmailsPlaceholder = {text: "Click here to select user Ids", count: {display: false, value: 0}};

  timeoutVar:any;

  apiSubscription:Subscription;
  
  constructor(
    public activeModal: NgbActiveModal, 
    private eventService: EventemittersService,
    private userService: UserService,
    private authService: AuthService,
    private apiService: ApiServiceService,
    private alertService: AlertifyService,
    private ellipsesService: EllipsisPipe
  ) { }
  
  ngOnInit(): void {
    if(this.currentPopUp==='sharing') {
      this.apiSubscription = this.userService.getAllUserByCols("Email").subscribe({
        next: (res:ApiMsgRes) => {
          if(!res.error) { 
            this.allUsers = res?.results;
            this.copyAllUsers = structuredClone(this.allUsers);
          }
        }
      });
    }
  }
  
  onDismissModal = () => this.activeModal.dismiss('Cross click');

  onRemove() {
    if(this.deleteType == "favourite") {
      this.userService.removeBookmarkData(this.dataId);
      this.eventService.confirmationEvent.next(true);
    } else if(this.deleteType == "delete") {
      this.apiService.deleteWorkspace(this.dataId).subscribe({
        next: (res:any) => {
          if(!res.error) {
            this.alertService.success("Workspace deleted successfully!");
            this.callBack.emit(true);
          }
        }, error: err => {
          this.alertService.error("An Error Occurred!");
          this.callBack.emit(false);
        }
      });
    } else if(this.deleteType == "customAnalysis") {this.callBack.emit();}

    this.onDismissModal();
  }

  contactFilter() {
    this.copyAllUsers = this.allUsers.filter(item => this.searchInp.toLowerCase() == ((item["Email"]).substring(0, this.searchInp.length)).toLowerCase())
  }

  bindSelectedMails() {
    const emailText = this.selectedEmailArr.toLocaleString().replace(new RegExp(",", "g"), ", ");
    this.selectedEmailsPlaceholder.text = this.ellipsesService.transform(emailText, 45);
    this.selectedEmailsPlaceholder.count = { display: true, value: this.selectedEmailArr.length };
    this.dropdownVisibility=false;
  }
  
  selectAllUserMails(isSelectAll:boolean) {
    this.isSelectAll = isSelectAll;

    if(!isSelectAll) {
      this.selectedUserId = [];
      this.selectedEmailArr = [];
      return;
    }
    
    this.allUsers.forEach((user:any) => {
      this.selectedUserId.push(Number(user["UserId"]));
      this.selectedEmailArr.push(user["Email"]);      
    });    
  }

  onClickShare() {
    // console.log("PRINT ==>",this.shareLinkOptions, this.downloadingLinksList, this.selectedEmailArr);
    if(this.shareLinkOptions.toPortal) this.shareDownloadingLinkOnPortal();
    if(this.shareLinkOptions.toEmail) this.shareDownloadingLinkOnEmail();
    setTimeout(() => this.onDismissModal(), 2000);
  }

  shareDownloadingLinkOnEmail() {
    this.apiService.sendDownloadingMail({
      downloadingLinkIDs: this.downloadingIDsList, 
      userEmails: this.selectedEmailArr
    }).subscribe({
      next: (res:any) => {if(!res?.error) this.alertService.success("Downloading Links has been successfully sent on the user Email IDs");},
      error: (err:any) => console.log(err)
    });
  }

  shareDownloadingLinkOnPortal() {
    this.hasSubmitted = true;
    const bodyObj = {
      WorkspaceId: this.downloadWorkspaceId,
      UserIdto: this.selectedUserId,
      UserIdBy: Number(this.authService.getUserId())
    };

    this.apiService.shareDownloadLink(bodyObj).subscribe({
      next: (res:any) => { if(!res?.error) { this.hasSharedLink = true; } },
      error: (err:any) => console.log(err)
    });
  }

  setItemVal(e:any, data:any) {
    const isChecked = e.target.checked;

    if(isChecked) {
      this.selectedUserId.push(Number(data["UserId"]));
      this.selectedEmailArr.push(data["Email"]);
    } else {
      this.selectedUserId = this.selectedUserId.filter(item => item != data["UserId"]);
      this.selectedEmailArr = this.selectedEmailArr.filter(item => item != data["Email"]);
    }

    // isChecked ? 
    // : 

    // isChecked ? 
    // : 
    
    // this.searchInp = "";
    // this.dropdownVisibility = true;
    // if(this.timeoutVar) clearTimeout(this.timeoutVar);
    // this.timeoutVar = setTimeout(() => this.dropdownVisibility = false, 1000);
  }

  removeItemVal(data:any) {
    this.selectedEmailArr = this.selectedEmailArr.filter(item => item != data);
    const checkboxTag = document.getElementById(data) as HTMLInputElement;
    checkboxTag.checked = false;
  }

  doesItInclude(mail:string):boolean {
    return this.selectedEmailArr.includes(mail);
  }
}
