import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
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
  downloadWorkspaceId:any[] = [];
  selectedUserId:any[] = [];
  hasSubmitted:boolean = false;
  hasSharedLink:boolean = false;
  searchInp:string = "";
  selectedEmailArr:string[] = [];
  dropdownVisibility:boolean = false;

  timeoutVar:any;

  apiSubscription:Subscription;
  
  constructor(
    public activeModal: NgbActiveModal, 
    private eventService: EventemittersService,
    private userService: UserService,
    private authService: AuthService,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) { }
  
  ngOnInit(): void {
    if(this.currentPopUp=='sharing') {
      this.apiSubscription = this.userService.getAllUser().subscribe((res:any) => {
        if(!res.error) { 
          this.allUsers = res?.results;
          this.copyAllUsers = res?.results;
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

  onClickShare(){
    this.hasSubmitted = true;
    const bodyObj = {
      WorkspaceId: this.downloadWorkspaceId,
      UserIdto: this.selectedUserId,
      UserIdBy: Number(this.authService.getUserId())
    };

    this.apiService.shareDownloadLink(bodyObj).subscribe({
      next: (res:any) => {
        if(!res?.error) { this.hasSharedLink = true; }}
    });
  }

  setItemVal(e:any, data:any) {
    const isChecked = e.target.checked;

    isChecked ? this.selectedUserId.push(Number(data["UserId"]))
    : this.selectedUserId = this.selectedUserId.filter(item => item != data["UserId"]);

    isChecked ? this.selectedEmailArr.push(data["Email"])
    : this.selectedEmailArr = this.selectedEmailArr.filter(item => item != data["Email"]);
    
    this.searchInp = "";
    this.dropdownVisibility = true;
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
