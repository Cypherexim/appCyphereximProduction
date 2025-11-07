import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CountryListComponent } from '../../admin-panel/country-list/country-list.component';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { Subscription, forkJoin, interval } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertifyService } from 'src/app/services/alertify.service';
import { UserRoleAccess } from 'src/app/models/plan';
import { environment } from 'src/environments/environment';
import { SaveFileComponent } from '../../side-filter/modals/save-file/save-file.component';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { ApiMsgRes } from 'src/app/models/api.types';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css']
})
export class NavMenuComponent implements OnInit, OnDestroy {
  userInfo: any;
  downloadingFiles:any[] = [];
  isShowBanner:boolean = false;
  isDownloadingPanelHidden:boolean = true;
  userPlanDetails:any = {};
  downloadPoints:number=0;
  searchPoints:number=0;
  remainingdays:string="";
  countryName:any = "";
  combinedResponse:ApiMsgRes[] = [];
  allCountryList:any[] = [];
  unreadNotifications:any[] = [];
  lastTotalNotification:any[] = [];
  counterObj = {hasNotificationReceived: false, hasDownloadFileStarted: false};
  userCounter = {superAdmin:0, admin: 0, users: 0, subUsers: 0};
  bgColorClass:string = "home-background";
  currentRoleId:any = "";  
  marqueeMsg:string = "";
  warningMsg:string = "You don't have any remaining days left, please reanew your package to continue the service!";

  isDownloadingFile:boolean = false;
  isLoggedIn:boolean = false;
  loginSubscription:Subscription;
  apiSubscription:Subscription;
  apiSubscription2:Subscription;
  timeSubscription:Subscription;
  eventSubscription:Subscription;
  eventSubscription2:Subscription;
  eventSubscription3:Subscription;
  eventSubscription4:Subscription;
  eventSubscription5:Subscription;
  isPageLoading:boolean = false;
  loaderTimeout:Subscription;

  unlimited = {download: environment.unlimitedDownload, search: environment.unlimitedSearch};

  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    private eventService: EventemittersService,
    private userService: UserService,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) { }

  ngOnInit() {
    this.updateUserPlan();

    if (this.authService.isLoggedIn()) {
      this.showAlertMsg();   
      this.startCallingNotifications(); 
      // this.getAllAvailableCountriesAPI();

      this.isLoggedIn = this.authService.isLoggedIn();
      this.userInfo = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.searchPoints = isNaN(Number(this.userInfo.Searches)) ? 0 : Number(this.userInfo.Searches);
      this.downloadPoints = isNaN(Number(this.userInfo.Downloads)) ? 0 : Number(this.userInfo.Downloads);
      this.remainingdays = this.userInfo.remainingdays;
    }

    //at the time of login User values are to set via this event
    this.eventSubscription3 = this.eventService.onLoginEvent.subscribe(res => {
      if(!res.error && res.hasOwnProperty('results')) {
        this.userInfo = res.results;
        
        //start notification fetching on specific amount of time
        this.startCallingNotifications();
      }
    });

    this.loginSubscription = this.eventService.userStatusEvent.subscribe((res:any) => {
      if(res == 'update') {
        this.userService.updateUserPoints().subscribe((data:any) => {
          if(data.message == 'Ok' && data.results.length>0) {
            this.searchPoints = data.results[0].Searches;
            this.downloadPoints = data.results[0].Downloads;
            this.remainingdays = data.results[0].remainingdays;
            this.updateUserPlan();
            this.getAllUserAPI();
            this.authService.updateUserPoints(data.results[0]);

            //saving user access into localstorage
            let accessKeys = Object.keys(new UserRoleAccess());
            const userAccessRights = {};
            accessKeys.forEach((key, index) => {
              userAccessRights[key] = data.results[0][key=="DownloadsAccess" ? "dwnlds" : key];

              if(index+1 == accessKeys.length) this.authService.setUserAccess(userAccessRights);
            });
          }
        });
      }
    });

    this.eventSubscription = this.eventService.currentCountry.subscribe(res => {
      if((res.country == "India" || res.code == "IND") && this.authService.getUserCountry() == "India") {
        this.countryName = {};
        this.eventService.refreshPageNameEvent.next("advance");
      } else {
        this.countryName = res;
        this.eventService.refreshPageNameEvent.next("country");
      }     
    });

    this.eventSubscription5 = this.eventService.preLoginAPIsEvent.subscribe({
      next: (signal:boolean) => {
        if(signal) {
          // this.apiSubscription = this.userService.getCountrylist().subscribe({
          //   next: (res:any) => {
          //     if(!res?.error && res?.code == 200) {
          //       this.allCountryList = res?.results;//.filter(item => item["CountryName"] != "India");        
          //     }
          //   }, error: (err:any) => console.log(err)
          // });
        }
      }, error: (err2:any) => console.log(err2)
    });

    this.eventSubscription2 = this.eventService.toggleSearchLoader.subscribe({
      next: (res:any) => { 
        this.isPageLoading = res?.flag;
        this.bgColorClass = `${res?.page}-background`;
      }, error: (err:any) => this.isPageLoading = false
    });

    //event occurs on downloaing file background
    this.eventService.downloadListUpdate.subscribe(res => {
      if(res?.action == "add") {
        this.counterObj.hasDownloadFileStarted = true;
        this.downloadingFiles = this.downloadingFiles.filter(item => item?.fileName != res?.filename);
        this.downloadingFiles.push({fileName: res?.filename, status: res?.status});
      } else if(res?.action == "remove") this.downloadingFiles = this.downloadingFiles.filter(item => !["done", "failed"].includes(item?.status));
      else if(res?.action == "update") {
        this.downloadingFiles.map(item => {
          if(item?.fileName == res?.filename) item.status = res?.status;
        });
      }
    });

    //event to vanish notification counts
    this.eventService.vanishNotificationCount.subscribe(res => { if(res) this.unreadNotifications = []; });
    
    // this.getNotifications();
    // this.timeSubscription = interval(60000*2).subscribe({
    //   next: () => { this.getNotifications() }
    // });
  }

  startCallingNotifications() {
    this.getNotifications();
    this.timeSubscription = interval(60000*2).subscribe({
      next: () => { this.getNotifications() }
    });
  }

  getAllAvailableCountriesAPI() {
    const countryAPIkey = `${environment.apiurl}api/getAllGlobeCountries`;

    if((environment.apiDataCache).hasOwnProperty(countryAPIkey)) {
      this.allCountryList = environment.apiDataCache[countryAPIkey];
    } else {
      forkJoin([
        this.apiService.getAllGlobeCountries(),
        this.apiService.getAllCountriesDates()
      ]).subscribe({
        next: async(res:ApiMsgRes[]) => {
          this.combinedResponse = res;
          this.allCountryList = await this.alertService.refineGlobalCountryList(this.combinedResponse);
          
          environment.apiDataCache[countryAPIkey] = JSON.parse(JSON.stringify(this.allCountryList));
        }, error: (err:any) => console.log(err)
      });
    }
  }

  getAllUserAPI() {
    this.apiSubscription2 = this.userService.getAllUser().subscribe({
      next: (res:any) => {
        if(!res?.error) {
          const resultArr = res.results;
          this.currentRoleId = Number(this.authService.getUserSingleDetail("RoleId"));
          if(Number(this.currentRoleId)==1) { this.userCounter.superAdmin = resultArr.filter((item:any) => (1==Number(item["RoleId"]) && !item["ParentUserId"])).length; }
          if([1,2].includes(Number(this.currentRoleId))) {
            this.userCounter.admin = resultArr.filter((item:any) => 2==Number(item["RoleId"])).length;
            this.userCounter.users = resultArr.filter((item:any) => 3==Number(item["RoleId"])).length;
          }
          if([3].includes(Number(this.currentRoleId))) {
            //([1,4].includes(Number(item["RoleId"])) && item["ParentUserId"])
            const userId = this.authService.getUserId();
            this.userCounter.subUsers = resultArr.filter((item:any) => Number(item["ParentUserId"])==userId).length; 
          }
        }
      }, error: (err:any) => console.log(err)
    });
  }

  
  onClickNotification(e:any) {
    this.unreadNotifications = [];
    this.counterObj.hasNotificationReceived = false;
    this.eventService.headerClickEvent.emit("notification");
  }

  showLoaderBubble(onclick=false) {
    this.isDownloadingPanelHidden = onclick;
    this.counterObj.hasDownloadFileStarted = false;
  }

  ngOnDestroy() { 
    this.loginSubscription.unsubscribe(); 
    this.eventSubscription.unsubscribe();
    this.eventSubscription2.unsubscribe();
    this.eventSubscription3.unsubscribe();
    this.eventSubscription4.unsubscribe();
    this.eventSubscription5.unsubscribe();
    this.apiSubscription.unsubscribe();
    this.apiSubscription2.unsubscribe();
  }

  //to show mendatory alert marquee
  showAlertMsg() {
    this.apiService.getAlertMessage().subscribe({
      next: (res: any) => {
        if (!res.error) {
          const { txt_msg, start_date, end_date, status, show_marquee } = res?.results[0];
          const startDateVal = new Date(start_date).valueOf();
          const endDateVal = new Date(end_date).valueOf();
          const currentDateVal = new Date().valueOf();

          if(status && startDateVal<currentDateVal && currentDateVal<endDateVal) {
            const {marquee} = JSON.parse(txt_msg);
            this.marqueeMsg = marquee;
            this.isShowBanner = show_marquee;
          }
        }
      }, error: (err: any) => console.error(err)
    });
  }

  updateUserPlan() {
    if(this.authService.getUserId() == undefined) return;

    const tempRightsobj = {};
    const accessRightsKeys = Object.keys(new UserRoleAccess());//["AddPlan", "AddUser", "BlockUser", "ClientList", "DeletePlan", "DeleteUser", "DisableId", "EditPlan", "EditUser", "EnableId", "PlanList", "Search", "Share", "UnblockUser", "dwnlds"];

    this.eventSubscription4 = this.userService.getUserPlanDetail().subscribe((res:any) => {
      if(!res.error && res.code == 200 && res?.results.length > 0) {
        this.userPlanDetails = res?.results[0];
        this.eventService.userDetailsStore.next(this.userPlanDetails); //to provide values globally
      
        accessRightsKeys.forEach((val, index) => {
          if(val == "DownloadsAccess") tempRightsobj[val] = this.userPlanDetails["dwnlds"];
          else tempRightsobj[val] = this.userPlanDetails[val];

          if(index == accessRightsKeys.length-1) {
            this.eventService.userAccessRights.next(tempRightsobj);
          }
        });
      }
    });
  }

  loggedin = () => this.authService.isLoggedIn();

  onSignOut(anchorTag) {
    this.authService.logout();
    anchorTag.click();
  }

  ShowCountries() {
    if(!this.loggedin()) return;

    if(Number(this.userPlanDetails["remainingdays"])<=0) {
      this.alertService.showPackageAlert(this.warningMsg);
      return;
    }

    const modalRef = this.modalService.open(CountryListComponent, { windowClass: 'countryModalClass', centered: true });
    // (<CountryListComponent>modalRef.componentInstance).getCountryListInit(this.allCountryList);
  }

  onClickHeaderOption(type:string, fileName:string="") {
    this.eventService.headerClickEvent.emit(type);
    const settingTag = document.querySelector("div.setting-container>a") as HTMLDivElement;
    setTimeout(() => this.setDropClass(settingTag, 'cut'), 100);

    if(type == "download") {
      this.isDownloadingPanelHidden = true; //in case of download 'open_file' click
      setTimeout(() => this.eventService.downloadListUpdate.next({action: "highlight", filename: fileName}), 1500)
    }
  }

  onSelectTab(e:any, elem:HTMLDivElement, tabname:boolean) {
    if(Number(this.userPlanDetails["remainingdays"])<=0) {
      this.alertService.showPackageAlert(this.warningMsg);
      return;
    }

    e.target.classList.add('active');
    elem.classList.remove('active');
    this.eventService.dataTabChngEvent.next(tabname);
  }

  setDropClass(elem:HTMLElement, type:string) {
    if(type == "add") elem.classList.add("active-drop");
    else elem.classList.remove("active-drop");
  }

  getBackColor(points:number, type:string, total:number=0) {
    const colors = {success: "#4cbfa6", danger: "#fe0101", warning: "#d39e00", dark: "#343a40"};
    const percentage = total==0 ? 0 : this.getPointPercentage(points, total);

    if(type == "search" || type == "download") {
      if(0==percentage) return colors.dark;
      
      if(percentage<=10 && percentage>=0.1) return colors.danger;
      
      if(percentage<=25) return colors.warning;
      else return colors.success;
    } else if(type == "day") {
      return points==0 ? colors.dark : points<=15 ? colors.danger : points<=30 && points>15 ? colors.warning : colors.success;
    }
  }

  getPointPercentage(point:number, total:number):number {
    const floatingNum = parseFloat(`${(point / total) * 100}`).toFixed(2);
    const actualNumStr = floatingNum.split(".")[0] + "." + floatingNum.split(".")[1][0];
    return Number(actualNumStr);
  }

  getRemainingDays(days:number):number {
    return days < 0 ? 0 : (days || 0);
  }

  isPointsUnlimited(points:number) {
    if(Number(points) >= 50000) return "UNLIMITED";
    else return points;
  }


  getNotifications() {
    this.apiSubscription2 = this.apiService.getAllNotifications().subscribe({
      next: async(res:any) => {
        if(!res.error) {
          this.eventService.sendNotifications.next(res.results);

          const userPrefs = JSON.parse(this.authService?.getUserDetails()?.userPreference);
          if(!userPrefs.hasOwnProperty("notification")) {userPrefs["notification"] = [];}
          const seenIDs = userPrefs!=null ? userPrefs["notification"] : [];

          const results = res["results"];
          this.unreadNotifications = results.filter((item:any) => !seenIDs.includes(Number(item["Id"])))
                                            .map((item:any) => JSON.parse(item?.message));

          if(this.unreadNotifications.length > 0 && results.length > this.lastTotalNotification.length) {
            this.counterObj.hasNotificationReceived = true;
            this.lastTotalNotification = JSON.parse(JSON.stringify(results));
            const audioTag = document.getElementById("audioTag") as HTMLAudioElement;
            audioTag.play();
          }
        }
      },
      error: (err) => console.log(err)
    });
  }

  goToCompany() {
    this.eventService.headerClickEvent.emit("companyHunter");
  }
}



