import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { UserModel, UserPlanModel } from 'src/app/models/plan';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertifyService } from 'src/app/services/alertify.service';
import { UserService } from 'src/app/services/user.service';
import { PreviewComponent } from './preview/preview.component';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit, OnChanges, OnDestroy {
  currentFormType: string = 'user-form';
  formHeadingName: string = 'add user';
  buttonIndexNumb: number = 1;
  headVisibility:string = 'visible';
  indicatorLoc: string[] = ['15%', '48%', '81%'];
  currentLoc: string = this.indicatorLoc[0];

  filledFormData:any = {};

  hasSubmitted:boolean = false;
  isUserAdmin:boolean = true;

  @Input() currentTab:string = 'user-form';
  @Input() isOnlyForPlan:boolean = false;
  @Output() onChangePage:EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private userService: UserService,
    private eventService: EventemittersService,
    private modalService: NgbModal,
    private authService: AuthService,
    private alertifyService: AlertifyService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.currentFormType = this.currentTab;
    this.formHeadingName = 'add plan';
    this.currentLoc = this.indicatorLoc[1];
    this.buttonIndexNumb = 2;
  }

  ngOnInit(): void {
    this.isUserAdmin = this.authService.isUserAdmin();
  }

  ngOnDestroy(): void {
    this.isOnlyForPlan = false;
  }

  onSubmit = () => {
    this.hasSubmitted = !this.hasSubmitted;
    this.eventService.hasSubmittedFormAdmin.next({status: this.hasSubmitted, type: this.currentFormType});
  }

  onSubmitForm(e) {
    if(e?.submitFlag) {
      if(this.currentFormType == 'user-form') this.filledFormData['addUser'] = e?.data;
      else if(this.currentFormType == 'plan-form'){
        this.filledFormData['addPlan'] = e?.data;
        
        const tempPlanObj = {...this.filledFormData?.addPlan};
        
        const isUpdateMode = Object.keys(this.filledFormData).length == 1 
        ? this.filledFormData["addPlan"]["PlanId"] == "" ? false : true : false;

        tempPlanObj["Favoriteshipment"] = this.filledFormData?.addPlan?.Favoriteshipment?.favoriteName;
        tempPlanObj["Companyprofile"] = this.filledFormData?.addPlan?.Companyprofile?.profileName;
        tempPlanObj["Analysis"] = this.filledFormData?.addPlan?.Analysis?.analysisName;
    
        // if(!isUpdateMode) delete tempPlanObj["PlanId"];

        this.filledFormData["addPlan"] = tempPlanObj;

        if(this.isOnlyForPlan) {
          //to add and update,, for both
          this.userService.addUserPlan(this.filledFormData, isUpdateMode).subscribe({
            next: (res:any) => {
              if(!res?.error && res?.message == "Ok") {
                this.alertifyService.success(`Plan ${isUpdateMode ? "Updated" : "Added"} Successfully!`);
                this.onChangePage.emit("planList"); //to move planList page
              } else this.alertifyService.error("An Error Occured!");
            }, error: (err:any) => this.alertifyService.error(err.error.message)
          });
        } else {
          const tempAddUser = {...this.filledFormData["addUser"]};
          const tempAddPlan = {...this.filledFormData["addPlan"]};

          //if it is update mode then password should not be updated as it is
          //already genereated or may have been changed by user
          if(tempAddUser?.ActionType != "update") {
            tempAddUser["Password"] = tempAddUser["Email"].substring(0, 5) + tempAddUser["MobileNumber"].split('').splice(5, 5).join('');
          } else delete tempAddUser["Password"];
          
          const combinedObjData = {...tempAddUser, ...tempAddPlan};

          ["selectedPlan","Amount"].forEach(key => delete combinedObjData[key]);
          this.showFinalPreview(combinedObjData);
        }
      } else {
        this.filledFormData['payment'] = e?.amount;
        // this.userService.addUserPlan(this.filledFormData).subscribe(res => {
        //   console.log(res);
        // }, (error) => {
        //   console.log(error)
        // });
      }
    }

    setTimeout(() => this.hasSubmitted = false, 800); //to change the value so as to use it again
    if(e.submitFlag && !this.isOnlyForPlan && this.currentFormType!='plan-form' && this.isUserAdmin) this.moveIndicator();
    else {
      if(!this.isUserAdmin && e.submitFlag) console.log("Sub-User is gonna be saved soon");
    }
  }

  moveIndicator = (customIndex: number = undefined) => {
    if (this.buttonIndexNumb <= 2 && customIndex == undefined) {
      this.currentFormType = this.buttonIndexNumb == 1 ? 'plan-form' : 'payment-form';
      this.currentLoc = this.indicatorLoc[this.buttonIndexNumb];
    } else if (customIndex != undefined) {
      this.buttonIndexNumb = customIndex;
      this.currentFormType = this.buttonIndexNumb == 0 ? 'user-form' : this.buttonIndexNumb == 1 ? 'plan-form' : 'payment-form';
      this.currentLoc = this.indicatorLoc[this.buttonIndexNumb];
    }
    // this.formHeadingName = this.currentFormType == 'user-form'
    // ? 'add user' : this.currentFormType == 'plan-form'
    //   ? 'add plan' : 'nothing';
    
    this.headVisibility = this.formHeadingName == 'nothing' ?'hidden':'visible';

    this.buttonIndexNumb++;
  }


  showFinalPreview(data) {
    const modalRef = this.modalService.open(PreviewComponent, { backdrop: "static", keyboard: false, windowClass: "countryModalClass" });
    (<PreviewComponent>modalRef.componentInstance).combinedData = data;
    const callBackSub =(<PreviewComponent>modalRef.componentInstance).callBack.subscribe((res:any) => {
      if(res != "OK") this.alertifyService.error(res);
      this.onChangePage.emit("userList");
      callBackSub.unsubscribe();
    });
  }

  getHeightOnRes():string {
    if(window.screen.width == 1400) return "75%";
    return "70%";
  }
}
