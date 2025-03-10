import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';
import { DownloadModelComponent } from '../homepage/components/download-model/download-model.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnChanges, AfterViewInit {
  isSidebarDisable:boolean = false;
  currentTab:string = '';
  isCurrentTabCls:boolean = false;
  profileBoxCls: string = 'profile-container';
  teamProfileBoxHeight:string = '75vh';
  isProfileBoxBig:boolean = false;
  indicator = {weak: false, average: false, good: false, excellent: false};
  hintColorBools = {weak: false, average: false, good: false, excellent: false};
  password = {oldP: "", newP: "", confirmP: ""};
  isUpdateClicked:boolean = false;
  isMismatch:boolean = false;
  indicatorIndex:number[] = [];
  passwordStatus = 'Must have alteast 6 characters';
  userPlanDetails:any = {};
  userDetails:any = {};
  planValues:any[] = [
    {
      planLevel: 'StartUp',
      planPrice: 999,
      points: 240000,
      startFrom: 2022,
      searches: 500,
      hasAddOn: false,
      recordValue: 0.006
    },
    {
      planLevel: 'Corporate',
      planPrice: 1699,
      points: 420000,
      startFrom: 2019,
      searches: 1200,
      hasAddOn: true,
      recordValue: 0.004
    },
    {
      planLevel: 'Enterprise',
      planPrice: 4999,
      points: 1500000,
      startFrom: 2010,
      searches: '',
      hasAddOn: true,
      recordValue: 0.003
    }
  ];

  searchPoints:number = 0;
  downloadPoints:number = 0;
  remainingdays:number = 0;

  eventSubscription:Subscription;
  eventSubscription2:Subscription;

  unlimited = {download: environment.unlimitedDownload, search: environment.unlimitedSearch};

  @Input() option:string = '';

  constructor(
    private authService: AuthService, 
    private modalService: NgbModal,
    public userService: UserService,
    private alertService: AlertifyService,
    private eventService: EventemittersService  
  ) { }

  ngOnChanges() {
    if(this.option != '') {
      this.toggleSidebar(this.option);
    } 
  }

  ngAfterViewInit(): void {
    this.hideSidebar(true);
  }

  ngOnInit(): void {
    this.eventSubscription = this.eventService.userDetailsStore.subscribe(res => {
      this.userPlanDetails = res;
      // this.userPlanDetails["Analysis"] = "exporter analysis,importer analysis";
    });

    this.userDetails = this.authService.getUserDetails();

    // this.eventSubscription2 = this.eventService.userStatusEvent.subscribe((res:any) => {
    //   if(res == 'update') {
    //     this.userService.updateUserPoints().subscribe((data:any) => {
    //       if(data.message == 'Ok' && data.results.length>0) {
    //         this.searchPoints = data.results[0].Searches;
    //         this.downloadPoints = data.results[0].Downloads;
    //         this.remainingdays = data.results[0].remainingdays;
    //       }
    //     });
    //   }
    // });
  }

  onClickSingOut = () => this.authService.logout();

  toggleSidebar(tabName) {
    if(Number(this.userPlanDetails["remainingdays"])<=0) {
      this.alertService.showPackageAlert("You don't have any remaining days left, please reanew your package to continue the service!");
      return;
    }

    this.isCurrentTabCls = !this.isCurrentTabCls;

    this.profileBoxCls = this.profileBoxCls === 'profile-container'
      ? 'profile-container collapsed-time' : 'profile-container';
      this.hideSidebar(true);
    if(this.isSidebarDisable){
      setTimeout(() => {
        this.currentTab = this.isSidebarDisable ? '' : tabName;
        this.isSidebarDisable = !this.isSidebarDisable;
      }, 201);
      // this.hideSidebar(true);
    } else {
      this.currentTab = this.isSidebarDisable ? '' : tabName;
      this.isSidebarDisable = !this.isSidebarDisable;
      // this.hideSidebar();
    }
  }

  hideSidebar(optionalBool=false) {
    const sidebarContainer = document.getElementById('sidebar') as HTMLDivElement;    
    const tag = document.getElementById('sidebarHandle') as HTMLImageElement;
    // tag.parentElement.classList.toggle('stopSidebarHandle');
    const hasCollapsedClass = Object.values(sidebarContainer.classList).includes('sidebar-body-shrink');

    // if(!hasCollapsedClass && !optionalBool) tag.click();
    // else if(optionalBool) tag.click();
    if(!hasCollapsedClass && optionalBool) tag.click();
  }

  onTeamProfileZoomClick(currentScale) {
    if(currentScale != 'minimize') {
      this.teamProfileBoxHeight = '75vh';
      this.isProfileBoxBig = false;
    } else {
      this.teamProfileBoxHeight = '80vh';
      this.isProfileBoxBig = true;
    }
  }


  onFocusNewPass(element:HTMLDivElement) {element.classList.add('active');}

  onFocusOutNewPass(element:HTMLDivElement) {element.classList.remove('active');}

  setPassStrengthPriority() {
    if(this.indicatorIndex.length > 0 && !this.indicatorIndex.includes(4)) {
      this.indicatorIndex.push(this.indicatorIndex[this.indicatorIndex.length-1]+1);
    } else this.indicatorIndex.push(1);
  }
  onChangeNewPass(event){
    const currentValue:string = event.target.value;
    
    if(currentValue.length >= 6) {
      if(currentValue.search(new RegExp("[a-z]", "g")) >= 0){
        if(!this.indicator.weak) this.setPassStrengthPriority();
        this.indicator.weak = true;
        this.passwordStatus = 'weak password';
      } else {
        if(this.indicator.weak) this.indicatorIndex.pop();
        this.indicator.weak = false;
      }

      if(currentValue.search(new RegExp("[A-Z]", "g")) >= 0) {
        if(!this.indicator.average) this.setPassStrengthPriority();
        this.indicator.average = true;
        this.passwordStatus = 'average password';
      }else {
        if(this.indicator.average) this.indicatorIndex.pop();
        this.indicator.average = false;
      } 

      if(currentValue.search(new RegExp("[0-9]", "g")) >= 0) {
        if(!this.indicator.good) this.setPassStrengthPriority();
        this.indicator.good = true;
        this.passwordStatus = 'good password';
      } else {
        if(this.indicator.good) this.indicatorIndex.pop();
        this.indicator.good = false;
      }
      
      if(currentValue.search(new RegExp("[-’/`~!#*$@_%+=.,^&(){}[\]|;:”<>?\\]", "g")) >= 0) {
        if(!this.indicator.excellent) this.setPassStrengthPriority();
        this.indicator.excellent = true;
        this.passwordStatus = 'excellent password';
      } else {
        if(this.indicator.excellent) this.indicatorIndex.pop();
        this.indicator.excellent = false;
      }
    } else {
      this.passwordStatus = 'Must have alteast 6 characters';
      this.indicatorIndex = [];
      this.indicator = {weak: false, average: false, good: false, excellent: false};
    }

    if(this.indicatorIndex.includes(0)) { this.indicatorIndex.splice(this.indicatorIndex.indexOf(0), 1);}

    this.hintColorBools = {
      weak: this.indicatorIndex.includes(1) || this.indicatorIndex.includes(2) || this.indicatorIndex.includes(3) || this.indicatorIndex.includes(4),
      average: this.indicatorIndex.includes(2) || this.indicatorIndex.includes(3) || this.indicatorIndex.includes(4),
      good: this.indicatorIndex.includes(3) || this.indicatorIndex.includes(4),
      excellent: this.indicatorIndex.includes(4)
    }    
  }


  onChangePasswordSubmit(e) {
    this.isMismatch = false;
    const {oldP, newP, confirmP} = this.password;
    
    if([oldP, newP, confirmP].includes("")) return;

    if(newP != confirmP) {
      this.isMismatch = true;
      return;
    }

    this.isUpdateClicked = true;
    
    e.target.innerText = "Updating...";
    
    const apiBody = {
      Email: this.authService.getUserDetails()["Email"],
      NewPassword: newP,
      CurrentPassword: oldP
    };

    this.userService.changePassword(apiBody).subscribe((res:any) => {
      if(!res.error) {
        const modalRef2 = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'downloadModalClass' });
        (<DownloadModelComponent>modalRef2.componentInstance).modalType = 'password-msg';
        this.password = {oldP: "", newP: "", confirmP: ""};
      } 
      e.target.innerText = "Update";
      this.isUpdateClicked = false;
    }, err => {
      this.isUpdateClicked = false;
      e.target.innerText = "Update";
    });
  }
}
//new RegExp("[-’/`~!#*$@_%+=.,^&(){}[\]|;:”<>?\\]","g")