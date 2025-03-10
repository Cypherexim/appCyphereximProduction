import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnDestroy {
  combinedData:any = {};
  isLoading:boolean = false;
  isSucceed:boolean = false;
  isUpdatingMode:boolean = false;
  apiSubscription:Subscription;
  @Output() callBack:EventEmitter<any> = new EventEmitter();

  constructor(
    private userService: UserService,
    private activeModal: NgbActiveModal,
    private alertifyService: AlertifyService
  ) {}

  ngOnDestroy(): void {
    this.apiSubscription?.unsubscribe();
  }

  onFinalSubmit() {
    this.isLoading = true;
    const dataBody = {...this.combinedData};
    this.isUpdatingMode = (this.combinedData.hasOwnProperty("UserId") && this.combinedData?.UserId.length>0);
    delete dataBody["RoleName"];
    
    this.apiSubscription = this.userService.addPortalUser(dataBody).subscribe({
      next: (res:any) => {
        this.isLoading = false;
  
        if(!res?.error && res?.message == "Ok") this.isSucceed = true;
        else this.closeModal("An Error Occured!");
      }, error: (err:any) => {
        this.isLoading = false;
        this.closeModal();
        this.alertifyService.error(err.error.message);
      }
    });
  }

  closeModal(msg="") {
    this.activeModal.dismiss('Cross click');
    if(msg!="") this.callBack.emit(msg);
  }
}
