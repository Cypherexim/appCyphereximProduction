import { Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { Subscription, timer, forkJoin, Subject, takeUntil, Observable, of, concatMap, from, timeout, catchError } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { CounterTabsModel, SideFilterModel, FilterNames, SideFilterAccessModel } from 'src/app/models/others';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TableDataModalComponent } from './components/table-data-modal/table-data-modal.component';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { SaveFileComponent } from '../side-filter/modals/save-file/save-file.component';
import { DownloadModelComponent } from './components/download-model/download-model.component';
import { SideFilterPipe } from 'src/app/common/Pipes/side-filter.pipe';
import { LocatorModalComponent } from './components/locator-modal/locator-modal.component';
import { AlertifyService } from 'src/app/services/alertify.service';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { AuthService } from 'src/app/services/auth.service';
import { CountryHeads } from 'src/app/models/country';
import { environment } from 'src/environments/environment';
import { AllRightsService } from 'src/app/services/all-rights.service';
import { SplitHsCodePipe } from 'src/app/common/Pipes/split-hs-code.pipe';
import { NotifyAlertMsgComponent } from '../workstation/modals/notify-alert-msg/notify-alert-msg.component';
import { ApiMsgRes } from 'src/app/models/api.types';
const ALLOWED_RECORDS = 10000;
declare const $:any;

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})

export class HomepageComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() refresh: boolean = false;
  @Output() onShareFilterData: EventEmitter<any> = new EventEmitter();
  eventSubscription: Subscription;
  eventSubscription2: Subscription;
  eventSubscription3: Subscription;
  eventSubscription4: Subscription;
  eventSubscription5: Subscription;
  eventSubscription6: Subscription;
  eventSubscription7: Subscription;
  eventSubscription8: Subscription;
  eventSubscription9: Subscription;
  eventSubscription10: Subscription;
  eventSubscription11: Subscription;
  apiSubscription: Subscription;
  apiSubscription2: Subscription;
  apiSubscription3: Subscription;
  apiSubscription4: Subscription;
  apiSubscription5: Subscription;
  apiSubscription6: Subscription;
  apiSubscription7: Subscription;
  analysisApiSubscription:Subscription[] = [];

  destory$: Subject<any> = new Subject<any>();

  timerSubscription: Subscription;
  isDownloadingFile: boolean = false;
  isAnalysisTabActive: boolean = false;
  tableHeads: string[] = [];
  filterNames: FilterNames = new FilterNames();
  filterAccess: SideFilterAccessModel = new SideFilterAccessModel();
  convertor:Function = this.alertService.valueInBillion;

  warningMsg = {
    duration: "You have exceeded the searching duration limit, please search within 3 years of duration.",
    results: "Searched result size limit exceeded, please maintain size of result less than 5 lakh",
    country: "You have not selected country, please select country first.",
    direction: "Please set the direction of your choosen country first!",
    nothing: "Please provide atleast one value!"
  };

  counterTabs: any[] = [
    { tab: "values" },
    { tab: "records" },
    { tab: "code", key: "HsCode" },
    { tab: "suppliers", key: "Exp_Name" },
    { tab: "buyers", key: "Imp_Name" },
    { tab: "country", key: "Country" },
  ];
  tabSearchVal: string = "";

  dropdownVal1: any[] = [
    { value: 'import', placeholder: 'Import' },
    { value: 'export', placeholder: 'Export' }
  ];
  dropdownVal2: any[] = [
    { value: '0', placeholder: 'Latest Month' },
    { value: '1', placeholder: 'Last Month' },
    { value: '3', placeholder: 'Last 3 Month' },
    { value: '6', placeholder: 'Last 6 Month' },
    { value: '12', placeholder: 'Last Year' },
    { value: '00', placeholder: 'Custom' }
  ];
  monthsArr: string[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  firstSelectVal = "Select Direction";
  firstSelectClass = "inactive custom-dropdown";
  secSelectVal = this.dropdownVal2[0]["placeholder"];
  secSelectClass = "custom-dropdown";

  hsCodeDigit: string = "2";
  allHsCodeArr: any[] = [];
  hsCode: string = "";
  currentCountry: string = '';
  currentCountryData: any = {};
  product: string[] = [];
  tempProduct: string[] = [];
  country: string[] = [];
  word: string = "";
  selectedCountries: any[] = [];
  countriesList = {base: [], copy: []};
  countryWord:string = "";

  importerList: string[] = [];
  exporterList: string[] = [];

  fromDate: any;
  toDate: any;
  max: any = undefined; min: any = undefined; //calender attributes
  userNetworkDetails:any = {};

  //for the saved scenario purpose
  allDownloadNames: string[] = [];
  savedStatus = { isAlreadySaved: false, savedFileName: '', savedFileId: '', saveFolder: '' };

  isWordDropdown: boolean = false; // for product dropdown visibility
  isCountryDropdown: boolean = false; // for country dropdown visibility
  isOverDropItem:boolean = false;

  wordsArr: any[] = [];
  dateRange: any = "0";
  today = new Date();
  isCustomDate: boolean = false;
  isTabsVisible: boolean = false;
  lowerPanelObj: any = {
    hasSearchBtnClicked: false,
    arrowBtnClassName: "down-arrow"
  };

  dropdownList: Array<any> = [];
  selectedItems: Array<any> = [];

  dropdownSettings = {
    key: 'Hscode', //no need
    value: 'Hscode', //no need
    searchPlaceholder: 'Search HScode',
    enableSelectAll: false
  }

  refreshPageName: string = "";

  direction: string = "";
  showLowerPanel: boolean = false;
  lowerPanelStyle = { height: this.showLowerPanel ? '30%' : '12%', overflow: this.showLowerPanel ? 'hidden' : 'visible' };

  bottomTableView: boolean = false;
  isSearchingHsCode: boolean = false;
  isSearchBtnClicked: boolean = false; //if the search btn is clicked then returned data is empty so the msg will come
  isFilteringData: boolean = false;
  isSearchingData: boolean = false;
  isSearchingTimeOut: boolean = false;
  isTableLoader: boolean = false;
  selectedFilterArr: string[] = [];
  sortedHsCodeArr: any = {};

  apiBodyObj = { base: {}, filter: {} };
  counterValData = {};
  counterObj = { total: 0, values: 0, hsCode: 0, importers: 0, exporters: 0, country: 0 };

  //paginations variables
  pagePerView: number = 25; //offset
  currentPageNum: number = 0; //current page number
  cpyCurrentPageNum = 1;
  totalPages: number = 1; //total number of pages
  searchResult: any[] = [];
  copiedTableData: any[] = [];
  perPageData: any[] = [];
  //------------------------//

  isTotalDataReceived: boolean = false;
  isMainChecked: boolean = false;
  allSelectCheckedArr: string[] = [];
  workstationCache = {}; //for the selected data

  locatorData:any = {};
  locatorDisable = { exporter: '', importer: '' };
  analysisDataObj = { HsCode: [], Imp_Name: [], Exp_Name: [], Date: [], CountryOfOrigin: [], CountryOfDestination: [] };

  dataCounterTabs: CounterTabsModel = new CounterTabsModel();
  filterTableTabs: CounterTabsModel = new CounterTabsModel();
  sideFilterOptions: SideFilterModel = new SideFilterModel();
  sideFilterOptions2: SideFilterModel = new SideFilterModel();
  currentSearchingMode: string = "main";
  selectedFilterCache = {};

  isCurrentUserDemo: boolean = false;

  btnAccessibility = { search: false, download: false, days: false };

  filterPipe: SideFilterPipe = new SideFilterPipe();
  ellipsePipe: EllipsisPipe = new EllipsisPipe();
  splitHsPipe: SplitHsCodePipe = new SplitHsCodePipe();

  constructor(
    private alertService: AlertifyService,
    private modalService: NgbModal,
    public userService: UserService,
    private authService: AuthService,
    private userRightService: AllRightsService,
    private apiService: ApiServiceService,
    private searchService: SearchService,
    private eventService: EventemittersService
  ) { }

  ngOnChanges() {
    if (this.refresh) this.refreshCurrentPage();
  }

  ngOnInit() {
    this.showAlertMsg();
    this.getUserCurrentIP();
    this.eventService.preLoginAPIsEvent.next(true);
    this.eventService.userStatusEvent.emit('update');
    this.changeDateRange(this.dateRange);
    this.getHsCodeData();
    this.getDownloadNames();
    this.getCountryList();

    //to set the boolean variable if the current user plan is Demo or Trial
    this.eventService.userDetailsStore.subscribe({
      next: (res: any) => {
        if (Object.keys(res).length > 0) {
          const currentUserPlan: string = (res["PlanName"]).toLowerCase();
          this.isCurrentUserDemo = (currentUserPlan.includes("demo") || currentUserPlan.includes("trial"));
        }
      }, error: (err:any) => console.log("Error:", err)
    });

    // to get to know which page triggered the home to be refreshed
    this.eventSubscription6 = this.eventService.refreshPageNameEvent.subscribe({
      next: (res:any) => { if (res != "") this.refreshPageName = res; },
      error: (err:any) => console.log("Error:", err)
    });

    this.eventSubscription = this.eventService.currentCountry.subscribe({
      next: (res:any) => {
        this.disableLocatorBar(res); //to enabled or disabled the locator box

        //just unsubscribe before we subscribe another api hit
        this.apiSubscription2?.unsubscribe();

        // to set the input fields according to choosen country and its direction
        if (res.hasOwnProperty("country") && this.authService.getUserCountry() != res?.country && res.direction) {
          this.currentCountry = res.country || "India";
          this.direction = res?.direction;
          this.currentCountryData = res;
  
          const arrIndx = this.direction == 'export' ? 1 : 0;
          this.firstSelectVal = this.dropdownVal1[arrIndx]['placeholder'];
          const tag = document.getElementById('firstSelect') as HTMLDivElement;
          tag.classList.remove('disable');
  
          this.getCountryLocator();

          this.getSideFilterAccess(res);
          this.getCountryLatestDate();
        }
      }, error: (err:any) => console.log("Error:", err)
    });

    this.eventSubscription2 = this.eventService.saveModalEvent.subscribe({
      next: (res:any) => {
        if (res.flag) {
          this.savedStatus.isAlreadySaved = true; //getting save flag true from sidefilter saving action
          this.setBookmarkData(res);
        }
      }
    });

    this.eventSubscription3 = this.eventService.savedWorkspaceEvent.subscribe({
      next: (res:any) => {
        if (Object.keys(res).length > 0) {
          this.currentSearchingMode = "filter";
          setTimeout(() => this.getLastSavedData(res), 500);
        }
      }, error: (err:any) => console.log("Error:", err)
    });

    this.eventService.stopSearchingEvent.subscribe({
      next: (res:any) => {
        if (res) {
          this.apiSubscription?.unsubscribe();
          this.apiSubscription3?.unsubscribe();
          this.apiSubscription4?.unsubscribe();
          this.eventService.toggleSearchLoader.next({flag: false, page: "home"});
        }
      }, error: (err:any) => console.log("Error:", err)
    });

    //still looking for the opportunity to have this used
    this.eventSubscription4 = this.eventService.sidebarToggleEvent.subscribe(res => {
    });

    this.eventSubscription5 = this.eventService.applyFilterEvent.subscribe({
      next: (res:any) => {
        this.currentSearchingMode = "filter";
        if (res.filters.length > 0) {
          this.selectedFilterCache[res?.key] = res?.filters;
        } else {
          if (this.selectedFilterCache.hasOwnProperty(res?.key)) {
            delete this.selectedFilterCache[res?.key];
          }
        }
        this.filterOutTableData("filter");
      }
    });

    this.eventSubscription7 = this.eventService.userDetailsStore.subscribe({
      next: (res:any) => {
        if (Object.keys(res).length > 0) {
          this.btnAccessibility.download = Number(res["Downloads"]) > 0;
          this.btnAccessibility.search = Number(res["Searches"]) > 0;
          this.btnAccessibility.days = Number(res["remainingdays"]) > 0;
        } else {
          this.btnAccessibility.download = true;
          this.btnAccessibility.search = true;
          this.btnAccessibility.days = true;
        }
      }, error: (err:any) => console.log("Error:", err)
    });
    

    //on changing of tab from table to analysis or vice-versa
    this.eventSubscription8 = this.eventService.dataTabChngEvent.subscribe({
      next: (res:any) => {this.isAnalysisTabActive = res;},
      error: (err:any) => console.log("Error:", err)
    });

    //when product description gives value from side-filter bar
    this.eventSubscription9 = this.eventService.hightlightDescBySidebar.subscribe({
      next: (res:string) => {this.tempProduct = res.length ? [res] : [];},
      error: (err:any) => console.log(err)
    });
  }

  ngAfterViewInit(): void {
    this.setDurationCalenderLimit(); 
  }

  // save current route first
  refreshCurrentPage() {
    if (this.refreshPageName == "advance") {
      this.direction = "";
      this.firstSelectVal = "Select Direction";
      this.currentCountry = "India";
      this.eventService.currentCountry.next({ 
        // country: "India", 
        country: "",
        type: "CUSTOM",
        code: "IND" 
      });
      this.firstSelectClass = "custom-dropdown";
    } else this.firstSelectClass = "inactive custom-dropdown";

    this.secSelectVal = "Latest Month";
    this.secSelectClass = "custom-dropdown";

    this.product = [];
    this.tempProduct = [];
    this.dateRange = "0";
    this.workstationCache = {};
    this.allSelectCheckedArr = [];
    this.exporterList = [];
    this.importerList = [];
    this.selectedCountries = [];
    this.currentSearchingMode = "main";

    this.hsCodeDigit = "2";
    this.getHsCodeData();

    this.apiBodyObj = { base: {}, filter: {} };
    this.hsCode = "";
    this.searchResult = [];
    this.bottomTableView = false;
    this.isSearchBtnClicked = false;
    this.togglePanelView(false);
    this.savedStatus = { isAlreadySaved: false, savedFileName: '', savedFileId: '', saveFolder: '' };
    this.changeDateRange(this.dateRange);
    this.eventService.filterSidebarEvent.emit(false);
    this.eventService.setAnalysisDataEvent.next({});
    // this.eventService.locatorDataMove.next({});
    this.eventService.updateMultiselectDropDownEvent.next({ updateType: "clear", targetFrom: "home-1" });
    this.analysisDataObj = { HsCode: [], Imp_Name: [], Exp_Name: [], Date: [], CountryOfOrigin: [], CountryOfDestination: [] }; 
  }

  setDurationCalenderLimit() {
    const getMonthDigit = (i:any, j:any) => (this.monthsArr.indexOf(dataAccessDates[i].split("~")[j]) + 1) < 10
      ? "0" + (this.monthsArr.indexOf(dataAccessDates[i].split("~")[j]) + 1)
      : (this.monthsArr.indexOf(dataAccessDates[i].split("~")[j]) + 1);

    const dataAccessDates: string[] = (this.authService.getUserDetails()["DataAccess"]).split(",");

    let initialDate = `${dataAccessDates[0].split("~")[1]}-${getMonthDigit(0, 0)}-01`;
    let currentDate = dataAccessDates.length > 1
      ? `${dataAccessDates[1].split("~")[1]}-${getMonthDigit(1, 0)}-${new Date(Number((dataAccessDates[1]).split("~")[1]), Number(getMonthDigit(1, 0)), 0).getDate()}`
      : new Date().toISOString().split("T")[0];

    initialDate = new Date(initialDate).toISOString().split('T')[0];
    currentDate = new Date().toISOString().split('T')[0];

    this.max = currentDate;
    this.min = initialDate;
  }

  getHsCodeData() {
    const cacheKey = `${environment.apiurl}api/gethscode?digit=${this.hsCodeDigit}`;

    this.isSearchingHsCode = true;
    this.dropdownList = [];

    if (environment.apiDataCache.hasOwnProperty(cacheKey)) { //fetching data from cache
      this.dropdownList = environment.apiDataCache[cacheKey];
      setTimeout(() => this.isSearchingHsCode = false, 300);
    } else {
      const twoDigitKey = `${environment.apiurl}api/gethscode?digit=2`;
      const fourDigitKey = `${environment.apiurl}api/gethscode?digit=4`;
      const eightDigitKey = `${environment.apiurl}api/gethscode?digit=8`;
            
      forkJoin([
        this.userService.getHsCode("2"),
        this.userService.getHsCode("4"),
        this.userService.getHsCode("8")
      ]).subscribe({
        next: (res:any) => {       
          const hsCodeNum = Number(this.hsCodeDigit);
          environment.apiDataCache[twoDigitKey] = this.splitHsPipe.fetchHsCodes(res[0]["results"]);
          environment.apiDataCache[fourDigitKey] = this.splitHsPipe.fetchHsCodes(res[1]["results"]);
          environment.apiDataCache[eightDigitKey] = this.splitHsPipe.fetchHsCodes(res[2]["results"]);
          
          this.dropdownList = hsCodeNum==2 ? environment.apiDataCache[twoDigitKey] 
          : hsCodeNum==4 ? environment.apiDataCache[fourDigitKey] : environment.apiDataCache[eightDigitKey];
          
          setTimeout(() => this.isSearchingHsCode = false, 1000);
        }, error: (err:any) => {console.log(err);}
      });
    }
  }

  getSideFilterAccess(res:any) {
    if (res?.code == undefined || res?.direction == undefined || [undefined, "STATISTICAL"].includes(res?.type)) return;

    //to get all side filter access as per current country
    this.apiSubscription2 = this.searchService.getSideFilterAccess(res?.code, res?.direction, res?.type).subscribe({
      next: (res2: any) => {
        if (!res2?.error && res2?.results.length > 0) {          
          const tempObj = { ...res2?.results[0] };
          delete tempObj['Id'];
          tempObj['Country'] = true;
          this.filterAccess = tempObj;
        }
      }, error: (err:any) => { this.filterAccess = new SideFilterAccessModel(); }
    });
  }

  ngOnDestroy(): void {
    this.eventService.filterSidebarEvent.emit(false);
    this.eventSubscription?.unsubscribe();
    this.eventSubscription2?.unsubscribe();
    this.eventSubscription3?.unsubscribe();
    this.eventSubscription4?.unsubscribe();
    this.eventSubscription5?.unsubscribe();
    this.eventSubscription6?.unsubscribe();
    this.eventSubscription7?.unsubscribe();
    this.eventSubscription8?.unsubscribe();
    this.eventSubscription9?.unsubscribe();
    this.eventSubscription10?.unsubscribe();
    this.eventSubscription11?.unsubscribe();
    if (this.timerSubscription) this.timerSubscription?.unsubscribe();
    if(this.analysisApiSubscription.length>0) {
      this.analysisApiSubscription.forEach((apiSub:Subscription, index:number) => { 
        apiSub?.unsubscribe();
        if(this.analysisApiSubscription.length-1==index) {this.analysisApiSubscription = [];}
      });
    }
  }


  togglePanelView(flag:boolean, isCalledByDate:boolean=false) {
    if (isCalledByDate) this.getCountryLocator();

    if (flag) {
      this.lowerPanelObj.hasSearchBtnClicked = true;
      this.lowerPanelObj.arrowBtnClassName = 'up-arrow';
      this.showLowerPanel = true;
    } else {
      this.lowerPanelObj.arrowBtnClassName = 'down-arrow';
      this.showLowerPanel = false;
      this.selectedItems = [];
    }

    /////////to update lowerpanel visibility especially for the overflow/////////
    this.lowerPanelStyle.height = this.showLowerPanel ? '30%' : '12%';
    this.lowerPanelStyle.overflow = this.showLowerPanel ? 'hidden' : 'visible';
    setTimeout(() => {
      this.lowerPanelStyle.height = this.showLowerPanel ? '30%' : '12%';
      this.lowerPanelStyle.overflow = 'visible';
    }, 500);
  }

  getRoleWiseId(): string {
    return this.authService.isUserSubuser() ? this.authService.getUserParentId() : this.authService.getUserId();
  }

  inItSearchClickProcess(callBy:string) {
    return new Promise((resolve, reject) => {
      if (callBy != "workspace") this.savedStatus = { isAlreadySaved: false, savedFileName: '', savedFileId: '', saveFolder: '' };
      this.analysisApiSubscription = [];
      this.apiBodyObj = { base: {}, filter: {} };
      this.isTotalDataReceived = false;
      this.setCounterValues(true);
      this.bottomTableView = true;
      this.isMainChecked = false;
      this.workstationCache = {};
      this.isSearchBtnClicked = false;
      this.currentSearchingMode = callBy != "workspace" ? "main" : "filter";
      if (callBy != "workspace") this.selectedFilterCache = {};
      this.pagePerView = 25;
      this.alterTableHeads = Object.keys(new CountryHeads().fetchCountryHeads(this.currentCountry)[this.direction]);
      this.counterObj = { total: 0, values: 0, hsCode: 0, importers: 0, exporters: 0, country: 0 };

      this.apiBodyObj.base = {
        country: this.currentCountry,
        direction: this.direction,
        countryType: this.currentCountryData?.type,
        body: {
          page: 1,
          toDate: this.toDate,
          fromDate: this.fromDate,
          itemperpage: this.pagePerView,
          IsWorkspaceSearch: callBy == 'workspace',
          UserId: this.getRoleWiseId()
        }
      };

      if (this.hsCode != "") this.apiBodyObj.base["body"]["HsCode"] = [this.hsCode];
      if (this.product.length > 0) this.apiBodyObj.base["body"]["ProductDesc"] = this.product;
      if (this.exporterList.length > 0) this.apiBodyObj.base["body"]["Exp_Name"] = this.exporterList;
      if (this.importerList.length > 0) this.apiBodyObj.base["body"]["Imp_Name"] = this.importerList;
      
      if (this.selectedCountries.length > 0) {
        const countries = []; 
        const countryType = this.direction=="export" ? "CountryofDestination" : "CountryofOrigin";
        for(let i=0; i<this.selectedCountries.length; i++) {
          countries.push(this.selectedCountries[i]["data"]);
          if(i == this.selectedCountries.length-1) this.apiBodyObj.base["body"][countryType] = countries;
        }
      }

      resolve(true);
    });
  }

  OnClickSearch(callBy = "self") {
    if (!this.userRightService.search()) {
      this.alertService.showPackageAlert("Oops!, It seems that you have no right to search the data. Please contact your service provider.");
      return;
    }

    if (!this.btnAccessibility.search) {
      this.alertService.showPackageAlert("Oops!, You appear to have used your all searching points therefore you are not allowed to search data anymore");
      return;
    }

    if (this.currentCountry == "") {
      this.showAlertForSearch(this.warningMsg.country);
      return;
    }

    if (this.direction == "") {
      this.showAlertForSearch(this.warningMsg.direction);
      return;
    }

    if (
      this.hsCode == ""
      && this.exporterList.length == 0 
      && this.importerList.length == 0 
      && this.product.length == 0
    ) {
      this.showAlertForSearch(this.warningMsg.nothing);
      return;
    }

    if (this.toDate != "" && this.fromDate != "") {
      const toYear = new Date(this.toDate).getFullYear();
      const fromYear = new Date(this.fromDate).getFullYear();

      if (toYear - fromYear > 3) {
        this.showAlertForSearch(this.warningMsg.duration);
        return;
      }
    }

    this.apiSubscription4?.unsubscribe();

    this.inItSearchClickProcess(callBy).then(() => {
      this.getSearchData(this.apiBodyObj.base, callBy)
        .then((resolve: any) => {
          if (resolve.status == "done") {
            this.workstationCache = {};
            this.allSelectCheckedArr = [];
          }
        }).catch(error => console.log(error));
    });
  }


  getSearchData(apiData:any, callBy:string="self") {
    return new Promise(async (resolve, reject) => {
      this.includeTariffCode(apiData, callBy); //to give limitation according to given user plan tariffCode

      if (["self", "workspace"].includes(callBy)) this.eventService.filterSidebarEvent.emit(false);//it should be hidden while searching data
      //just unsubscribe before we subscribe it again coz it may give pending xhr request result.
      this.apiSubscription3?.unsubscribe();

      this.isTabsVisible = false;
      this.isSearchingTimeOut = false;
      this.eventService.toggleSearchLoader.next({flag: true, page: "home"});

      //just in case the data will not be received then it should be
      this.timerSubscription?.unsubscribe();
      this.timerSubscription = timer(300000).subscribe({
        next: (res:any) => {
          console.log("%cI am Timeout", "color:red;font-size:20px");
          if (this.searchResult.length == 0) {
            this.searchResult = [];
            this.isSearchingData = false;
            this.isSearchingTimeOut = true;
            this.eventService.toggleSearchLoader.next({flag: false, page: "home"});
            this.apiSubscription3?.unsubscribe();
            this.apiSubscription4?.unsubscribe();
          }
        }, error: (err:any) => console.log(err)
      });

      this.searchResult = []; 
      this.perPageData = [];      
      this.isSearchingData = true;

      try {
        const counterApiBody = { //to create counter API body obj
          countryname: (apiData["country"]).toLowerCase(),
          direction: apiData["direction"],
          countryType: apiData?.countryType,
          ...apiData["body"]
        };

        //to record the log on click of main search button
        this.onSetUserSearchLog(JSON.stringify(apiData));
        const queryStr = `searchCountry=${this.currentCountry}&direction=${this.direction}&fromDate=${this.fromDate}&toDate=${this.toDate}&hscode=${this.hsCode}&product=${this.product}&buyer=${this.importerList.toString().replace(new RegExp(",","g"),"")}&supplier=${this.exporterList.toString().replace(new RegExp(",","g"),"")}&country=${this.countryWord}&query=${JSON.stringify(apiData["body"])}`;
        const apiKey = `${environment.apiurl}api/get${this.country}${this.direction}?${queryStr}`;
        
        if(environment.apiDataCache.hasOwnProperty(apiKey) && environment.apiDataCache[apiKey][1]["results"]["data"].length>0) {
        // if(environment.apiDataCache.hasOwnProperty(apiKey)) {
          const response = environment.apiDataCache[apiKey];
          const promiseRes = await this.onFetchingSearchedDataFromCache({resolve, reject}, response, apiData, callBy);
          return promiseRes;
        } else {
          this.apiSubscription3 = forkJoin([
            this.searchService.getSearchedRecordCounting(counterApiBody),
            this.searchService.getSearchedDataWithFilter(apiData)
          ]).subscribe({
            next: async (responseArr:any[]) => {              
              environment.apiDataCache[apiKey] = responseArr;
              const promiseRes = this.afterFetchingOnSearchDataInternalProcess({resolve, reject}, responseArr, apiData, callBy);
              return promiseRes;
            }, error: (err:any) => {
              this.perPageData = [];
              this.searchResult = [];
              this.isSearchingData = false;
              this.isTotalDataReceived = true;
              this.isSearchBtnClicked = true;
              this.eventService.toggleSearchLoader.next({flag: false, page: "home"});
              this.eventService.filterSidebarEvent.emit(false);
              this.timerSubscription?.unsubscribe();
              reject({ status: 'done', msg: err });
            }
          });
        }

      } catch (error) {
        console.log(error);
        this.eventService.filterSidebarEvent.emit(false);
        reject({ status: 'done', msg: error });
      }
    });
  }

  onFetchingSearchedDataFromCache(promise:any, responseArr:any[], apiData:any, callBy:string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const promiseRes = this.afterFetchingOnSearchDataInternalProcess(promise, responseArr, apiData, callBy);
        resolve(promiseRes);
      }, 2000);
    });
  }

  async afterFetchingOnSearchDataInternalProcess(promise:any, responseArr:any[], apiData:any, callBy:string) {
    if(!responseArr[0]?.error) {
      const tempCounters = responseArr[0]?.results?.counters;    
      const keys = ["totalrecordscount", "hscodecount", "suppliercount", "buyercount", "countrycount", "totalvaluecount"];
      const counterObjKeys = ["total", "hsCode", "exporters", "importers", "country", "values"];
      keys.forEach((key:string, index:number) => {
        this.counterObj[counterObjKeys[index]] = Number(tempCounters[key]);
      });

      setTimeout(() => this.setCounterValues(), 200);              

      if (this.counterObj.total > 500000 && callBy=="self") {
        this.eventService.filterSidebarEvent.emit(false);
        this.timerSubscription?.unsubscribe();
        this.eventService.toggleSearchLoader.next(false);
        this.showAlertForSearch(this.warningMsg.results);
        return promise?.reject(new Error("More than 5 lack records are fetched!"));
      }
    }

    if(!responseArr[1]?.error) {
      this.timerSubscription?.unsubscribe();
      const results: any[] = responseArr[1]?.results?.data || responseArr[1]?.results || [];
      
      if (this.isSearchingData) this.isSearchingData = false;

      if (this.currentCountry !== "India") {
        if (results.length > 0 && ["filter", "self", "workspace"].includes(callBy)) this.tableHeads = this.getUserGenHeads(Object.keys(results[0]));
      } else {
        // India has different heads  
        this.arrangeTableHeads(); //setting 
        setTimeout(() => this.backToPrevState(), 1000);          
      }

      this.searchResult = results;
      this.perPageData = JSON.parse(JSON.stringify(this.searchResult));
      this.eventService.toggleSearchLoader.next({flag: false, page: "home"});

       //If result is blank then back to empty page showing "Data Not Found"
      if (this.searchResult.length == 0 && ["self", "workspace"].includes(callBy)) {
        this.timerSubscription?.unsubscribe();
        this.eventService.filterSidebarEvent.emit(false);
        this.eventService.toggleSearchLoader.next({flag: false, page: "home"});
        return promise?.reject(new Error("No Data Found!"));
      }

      this.colShifterInit(); //to start tableDnD on column shifter function

      if (["pagination-perpage", "self", "workspace", "filter"].includes(callBy)) {
        this.setCurrentTablePreview();
        this.isSearchBtnClicked = true;
      } else {
        if (results.length > 0) {
          this.onBindBookmark().then((res: any[]) => {
            this.scrollToTop();
            this.perPageData = res;
            const totalData = results.length > 0 ? Number(this.counterObj.total) <= ALLOWED_RECORDS ? Number(this.counterObj.total) : ALLOWED_RECORDS : 1;
            this.totalPages = Math.ceil(totalData / this.pagePerView);
            this.isTableLoader = false;
          });
        }
      }

      if (!apiData["body"]["IsWorkspaceSearch"]) this.eventService.userStatusEvent.emit('update');

      //================== side filter fetching values with their counters ====================//
      const paginationTypes = ["pagination-arrow","pagination-perpage"];
      this.eventService.filterSidebarEvent.emit(true); //to display ON of sidefilter options

      if (["self"].includes(callBy) && results.length > 0) {                  
        //api for getting data for side filters
        if (this.refreshPageName == "advance" || this.currentCountry == "India") {
          this.currentCountryData = { country: "India", code: "IND", direction: this.direction, type: this.currentCountryData?.type };
        }

        if(this.currentCountryData?.type !== "STATISTICAL" && !paginationTypes.includes(callBy)) await this.getSideFilterData(callBy, "base");
      } else {
        if(this.currentCountryData?.type !== "STATISTICAL" && !paginationTypes.includes(callBy)) await this.getSideFilterData(callBy, "filter");
      }

      if (this.perPageData.length == 0) this.setCounterValues(true); //if data is received [] then zero all counters
      else this.setCounterValues();              
    } else {
      this.eventService.toggleSearchLoader.next({flag: false, page: "home"});
      this.eventService.filterSidebarEvent.emit(false);
      this.showAlertForSearch(responseArr[1]?.message);
      return promise?.resolve({ status: 'done' });
    }
    
    this.getAllFullSideFilterData(callBy, apiData);
  }


  //this function is responsible to fetch sidefilter data
  getSideFilterData(callBy:string, apiBodyType:any) {
    return new Promise((resolve, reject) => {
      try {
        this.apiSubscription4?.unsubscribe();
  
        if (apiBodyType == "filter") {
          apiBodyType = Object.keys(this.apiBodyObj[apiBodyType]).length > 0 ? "filter" : "base";
        }        

        this.getSideFilterSegmentsData(callBy).then((res: any) => {
          if (!res.error) {
            const singleFilterLength = res.results[Object.keys(res.results)[0]];
            if (singleFilterLength.length > 0) {
              if (["self", "workspace"].includes(callBy)) {
                this.counterValData = res.results;
  
                if (callBy == "workspace") {
                  setTimeout(() => {
                    if (Object.keys(this.selectedFilterCache).length > 0) this.eventService.filterCacheMoveEvent.emit(this.selectedFilterCache);
                    const singleFilterLength = res.results[Object.keys(res.results)[0]];
                    if (singleFilterLength.length > 0) {
                      const givenFilterHeads = Object.keys(res.results);
                      for (let i = 0; i < givenFilterHeads.length; i++) {
                        this.sideFilterOptions2[givenFilterHeads[i]] = res?.results[givenFilterHeads[i]];
                      }
                    }
                  }, 500);
                }
              } else {
                this.counterValData = res.results; //now this variable is only responsible to update sidefilter or vice versa
  
                const singleFilterLength = res.results[Object.keys(res.results)[0]];
                if (singleFilterLength.length > 0) {
                  const givenFilterHeads = Object.keys(res.results);
                  for (let i = 0; i < givenFilterHeads.length; i++) {
                    this.sideFilterOptions2[givenFilterHeads[i]] = res?.results[givenFilterHeads[i]];
                  }
                }
              }
  
              this.passFilterValueData(); //passing here so that fresh data is to be transfered
              resolve(true);
            }
          }
        });
      } catch (error) {
        console.log("SIDE FILTER CALLING ERROR==>",error);
        reject(false);
      }
    });
  }

  // getSideFilterSegmentsData(callBy:string) {
  //   return new Promise((resolve, reject) => {
  //     const tempType = ["self"].includes(callBy) ? "base" : "filter";
  //     const tempUrlArr = this.searchService.getSideFilterSegments(this.apiBodyObj[tempType]["body"], this.currentCountryData);
  //     let sideFilterData = {};

  //     this.apiSubscription4 = forkJoin(tempUrlArr)
  //       .pipe(timeout(1000 * 90))
  //       .subscribe({
  //         next: (res:any) => {
  //           const countryType = this.apiBodyObj[tempType]["direction"]=="import"?"CountryofOrigin":"CountryofDestination";
  //           const indexKeys = {0: "HsCode", 1: countryType, 5: "Exp_Name", 6: "Imp_Name"};
            
  //           res.forEach((item:any, index:number) => {
  //             if([0,1,5,6].includes(index)) sideFilterData[indexKeys[index]] = item?.results;
  //             else sideFilterData = { ...sideFilterData, ...item?.results };
              
  //             if (index == res.length - 1) resolve({
  //               message: "Ok",
  //               error: false,
  //               code: 200,
  //               results: sideFilterData
  //             });
  //           });
  //         },error: (err:any) => {resolve(this.getSideFilterSegmentsData(callBy));}
  //       });
  //   });
  // }


  //calling this function to fetch only 10 records list of side filter not full
  getSideFilterSegmentsData(callBy:string) {
    return new Promise((resolve, reject) => {
      const tempType = ["self"].includes(callBy) ? "base" : "filter";
      // const tempUrlArr = this.searchService.getSideFilterSegments(this.apiBodyObj[tempType]["body"], this.currentCountryData);
      const filterApiBody = {
        ...(JSON.parse(JSON.stringify(this.apiBodyObj[tempType]["body"]))), 
        countryType: this.currentCountryData?.type,
        CountryCode: this.currentCountryData?.code,
        CountryName: this.currentCountryData?.country,
        Direction: this.currentCountryData?.direction,
        isSideFilter: true,
        limit: 10
      };
      const tempUrlArr = this.apiService.getAllSideFilters(filterApiBody, this.filterAccess);
      let sideFilterData = {};

      const queryStr = `searchCountry=${this.currentCountry}&direction=${this.direction}&fromDate=${this.fromDate}&toDate=${this.toDate}&hscode=${this.hsCode}&product=${this.product}&buyer=${this.importerList.toString().replace(new RegExp(",","g"),"")}&supplier=${this.exporterList.toString().replace(new RegExp(",","g"),"")}&country=${this.countryWord}&query=${JSON.stringify(filterApiBody)}`;
      const apiKey = `${environment.apiurl}api/getPartialAllSideFilter?${queryStr}`;

      if(environment.apiDataCache.hasOwnProperty(apiKey)) {
        const sideFilterData = environment.apiDataCache[apiKey];
        resolve({ message: "Ok", error: false, code: 200, results: sideFilterData });
      } else {
        this.eventSubscription11 = this.apiSubscription4 = forkJoin(tempUrlArr).subscribe({
            next: (res:any) => {
              for(let i=0; i<res.length; i++) {
                const singleFilterItem = Object.keys(res[i]?.results[0]);
                const filterNameKey = singleFilterItem[0]!="valueinusd" ? singleFilterItem[0]: singleFilterItem[1];
  
                if(filterNameKey=="Quantity") {
                  sideFilterData[filterNameKey] = res[i]?.results.map((item:any) => Number(item["Quantity"]));
                } else sideFilterData[filterNameKey] = res[i]?.results;
              }
              environment.apiDataCache[apiKey] = sideFilterData;
              resolve({ message: "Ok", error: false, code: 200, results: sideFilterData });           
            },error: (err:any) => console.log(err)
        });
      }
    });
  }


  getUserGenHeads(headsArr: string[]): string[] {
    const oldHeadsArr = headsArr;
    const index = oldHeadsArr.indexOf("RecordID");
    if(index>-1) oldHeadsArr.splice(index, 1);
    //oldHeadsArr.splice(oldHeadsArr.indexOf("totalValueCount"), 1);
    const newHeadsArr = [];
    const requiredPreHeads = [
      "Date",
      this.filterNames.HsCode.key,
      this.filterNames.ProductDesc.key,
      this.filterNames.Exp_Name.key,
      this.filterNames.Imp_Name.key,
      this.direction=="export" ? this.filterNames.CountryofDestination.key: this.filterNames.CountryofOrigin.key,
      this.filterNames.Quantity.key,
      this.filterNames.uqc.key,
      this.filterNames.Currency.key
    ];

    for (let i = 0; i < requiredPreHeads.length; i++) {
      if (oldHeadsArr.includes(requiredPreHeads[i])) {
        newHeadsArr.push(requiredPreHeads[i]);
        oldHeadsArr.splice(headsArr.indexOf(requiredPreHeads[i]), 1);
      }

      if (i == requiredPreHeads.length - 1) newHeadsArr.push(...oldHeadsArr);
    }

    return newHeadsArr;
  }

  // alert message for low points and making mistakes
  showAlertForSearch(message) {
    this.searchResult = [];
    this.bottomTableView = false;
    this.eventService.filterSidebarEvent.emit(false);
    this.alertService.showWarningAlert(message);
  }


  //given Data counter function
  setCounterValues(reset:boolean = false) {
    this.dataCounterTabs.records = reset ? 0 : this.counterObj.total;
    this.dataCounterTabs.code = reset ? 0 : this.counterObj.hsCode;
    this.dataCounterTabs.suppliers = reset ? 0 : this.counterObj.exporters;
    this.dataCounterTabs.buyers = reset ? 0 : this.counterObj.importers;
    this.dataCounterTabs.country = reset ? 0 : this.counterObj.country;
    this.dataCounterTabs.values = reset ? 0 : this.counterObj.values;

    this.isTotalDataReceived = true; //it is true becoz we no longer need of tabs loader
    ///////////////////////////////////////////////////////////////////////////////////
    if (reset) {
      this.counterValData = {};
      this.sideFilterOptions = new SideFilterModel();
      this.sideFilterOptions2 = new SideFilterModel(); //we need to clean it too or else it would show prev data
      this.onShareFilterData.emit(this.sideFilterOptions);//to clean side filter values      
      this.eventService.passFullSideFilterData.next({}); //clean passing side filter cache
      return;
    }//if the function is called for reset pupose then no need to call further processes
    if(Object.keys(this.counterValData).length==0) return;
    ///////////////////////////////////////////////////////////////////////////////////

    this.passFilterValueData(); //passing here so that sidefilters can be empty in case of new search
  }

  passFilterValueData() {
    this.setAvailableFilterValArr();

    this.eventService.passFilterDataEvent.next({
      data: Object.keys(this.counterValData).length > 0 ? this.counterValData[this.filterNames.HsCode.key] : [],
      filterCache: this.selectedFilterCache
    }); //to pass data to HsCode tree

    setTimeout(() => { this.onShareFilterData.emit(this.sideFilterOptions); }, 2500);
  }

  //set others side filter values array coz we don't need to count their record
  setAvailableFilterValArr() {
    const tempFilterAccess = { ...this.filterAccess }
    delete tempFilterAccess["Country"];
    delete tempFilterAccess["Direction"];
    const filterAccessKeys = Object.keys(tempFilterAccess);

    const counterValDataLen = Object.keys(this.counterValData).length;
    for (let key of filterAccessKeys) {
      if (this.filterAccess[key] && this.counterValData.hasOwnProperty(key)) {
        if (key == "Quantity") this.sideFilterOptions[key] = counterValDataLen ? [Math.max(...this.counterValData[key])] : [];
        else this.sideFilterOptions[key] = counterValDataLen ? this.counterValData[key] : [];
      }
    }
  }

  //on click of reset button
  onClickReset() {
    this.direction = '';
    this.product = [];
    this.tempProduct = [];
    this.word = "";
    this.currentCountry = '';
    this.currentCountryData = {};
    this.selectedItems = [];
    this.searchResult = [];
    this.copiedTableData = [];
    this.workstationCache = {};
    this.selectedFilterArr = [];
    this.selectedCountries = [];
    this.selectedFilterCache = {};
    this.bottomTableView = false;
    this.currentSearchingMode = "main";
    this.apiBodyObj = { base: {}, filter: {} };
    this.firstSelectVal = "Select Direction";
    this.secSelectVal = "Latest Month";
    this.secSelectClass = "custom-dropdown";
    this.isCustomDate = false;
    this.exporterList = []; this.importerList = [];
    this.eventService.filterSidebarEvent.emit(false);
    this.eventService.currentCountry.next({});
    this.eventService.setAnalysisDataEvent.next({});
    this.eventService.locatorDataMove.next({});
    this.counterObj = { total: 0, values: 0, hsCode: 0, importers: 0, exporters: 0, country: 0 };
    this.eventService.updateMultiselectDropDownEvent.next({ updateType: "clear", targetFrom: "home-1" });
    this.analysisDataObj = { HsCode: [], Imp_Name: [], Exp_Name: [], Date: [], CountryOfOrigin: [], CountryOfDestination: [] };

    this.hsCodeDigit = "2";
    this.getHsCodeData();
    this.dateRange = "0";
    this.changeDateRange(this.dateRange);
  }

  getCountryLatestDate() {
    const dataObj = { 
      country: this.currentCountryData?.code, 
      direction: this.direction, 
      countryType: this.currentCountryData?.type 
    };
    this.apiService.getCountryLatestDate(dataObj).subscribe({
      next: (res: any) => {
        if (!res.error && res.results.length > 0) {
          const rawDate = res?.results[0]["LatestDate"];
          if (!this.isCurrentUserDemo) { //in case of Main Plan user, they get latest update limit
            this.max = new Date(rawDate).toISOString().split('T')[0];
            this.changeDateRange(this.dateRange);
          } else {  //in case of demo or trail Plan users, they will get their data-access limit
            const dataAccessDate: string = this.userService.getUserDataAccess();
            const toDateRaw = (dataAccessDate.split(",")[1]).split("~");
            const monthInt = this.monthsArr.indexOf(toDateRaw[0]) + 1;
            const totalDays = new Date(Number(toDateRaw[1]), monthInt, 0).getDate();
            const toDate = new Date(`${toDateRaw[1]}-${monthInt < 10 ? "0" + monthInt : monthInt}-${totalDays}`);
            const latestDate = new Date(rawDate);
            const [latest, dataAccess] = [latestDate.valueOf(), toDate.valueOf()];
  
            (latest < dataAccess)
              ? this.max = new Date(rawDate).toISOString().split('T')[0]
              : this.max = new Date(toDate).toISOString().split('T')[0];
            this.changeDateRange(this.dateRange);
          }
        }
      }
    });
  }

  onselectItem(value:any, name:any, type:string, textBoxTag:any) {
    if (type == 'first') {
      this.firstSelectVal = name;
      this.direction = value;

      //sometimes it doesn't have value but "", therefore it is allowed get inside so then it 
      //gets what it is suppose to have
      if (["advance", ""].includes(this.refreshPageName)) {
        if (this.refreshPageName == "") this.refreshPageName = "advance"; //here it get the real value
        this.eventService.currentCountry.next({ 
          country: "", 
          code: "IND", 
          direction: this.direction, 
          type: "CUSTOM",
        });
        this.currentCountryData = { country: "India", code: "IND", direction: this.direction, type: "CUSTOM" };
        this.getSideFilterAccess(this.currentCountryData);
      }
      this.getCountryLatestDate();
      if (this.secSelectVal != 'Select Period') this.togglePanelView(true);
    } else if (type == 'second') {
      // if(this.userService.isCurrentPlanDemo()) return; //if it is demo plan, duration selection is not allowed
      this.secSelectVal = name;
      this.dateRange = value;
      this.changeDateRange(this.dateRange);

      if (value != '6') this.togglePanelView(true);
    }
    textBoxTag.classList.remove('disable');
    //to hide drop panel
  }

  //toset dropdown visibility class
  setDropClass(elem:any, type:string) {
    if (type == "add") elem.classList.add("drop-active");
    else elem.classList.remove("drop-active");
  }

  getCountryLocator() {
    if (this.direction == "") return;

    this.apiSubscription?.unsubscribe();

    //this is to know that which locator is available in which country to call its locator API
    const countryObj = new CountryHeads();
    const countryInfo = countryObj.fetchCountryHeads(this.currentCountry);
    const locatorFlags = countryInfo["locators"][this.direction];

    this.locatorData = {};
    this.locatorDisable = { exporter: '', importer: '' };
    const date = { from: this.fromDate, to: this.toDate };
    const dataObj = { country: this.currentCountry, date };

    if(locatorFlags["Imp_Name"]) this.getGlobeLocators(dataObj, "import");
    if(locatorFlags["Exp_Name"]) this.getGlobeLocators(dataObj, "export");
  }

  getGlobeLocators(body:any, direction:any) {
    body = {...body, direction: this.direction,
      countryType: this.currentCountryData?.type,
      locatorType: direction=="import"? "Buyer": "Supplier"
    };

    const apiCacheKey = `${environment.apiurl}api/locator/${this.currentCountry}/${this.direction}/${direction}er`;
    if(environment.apiDataCache.hasOwnProperty(apiCacheKey)) {
      this.eventService.locatorDataMove.next(environment.apiDataCache[apiCacheKey]);
    } else {
      // this.apiSubscription7?.unsubscribe();
      this.apiSubscription7 = this.apiService.getGlobeImpExpLocator(body).subscribe({
        next: async(res:any) => {
          if (!res?.error) {
            if(direction == "import") {this.locatorData["Imp_Name"] = await this.alertService.getModifiedObj(res?.results, "Imp_Name");}
            else if(direction == "export") {this.locatorData["Exp_Name"] = await this.alertService.getModifiedObj(res?.results, "Exp_Name");}
            
            environment.apiDataCache[apiCacheKey] = this.locatorData;

            if (res?.results?.length > 0) {
              this.eventService.locatorDataMove.next(environment.apiDataCache[apiCacheKey]);
            } else this.eventService.locatorDataMove.next({ error: true, from: "error" });            
          } else this.eventService.locatorDataMove.next({ error: true, from: "error" });
        }, error: (err:any) => this.eventService.locatorDataMove.next({ error: true, from: "error" })
      });
    }
  }

  changeDateRange(dateRange:any) {
    if (this.dateRange != "00") {
      const latestDate = this.max ? this.max : new Date();
      const dates = this.alertService.getCalenderDates(Number(dateRange), latestDate);
      this.fromDate = dates.from;
      this.toDate = dates.to;
      this.isCustomDate = false;
    } else { this.isCustomDate = true; }
  }

  onSelectHsCode(data:any) {
    if (data.length > 0) this.hsCode = data[0];
    else this.hsCode = "";
  }

  sidebarToggle(eventBool:any) {
    const sidetag = document.getElementById('sidebar') as HTMLDivElement;
    sidetag.classList.toggle('sidebar-body-shrink');
  }


  //get locator modal for exporter and importer
  getLocatorModal(event:any, type:string) {
    if(
      (this.isOverDropItem && this.exporterList.length!=0) ||
      (this.isOverDropItem && this.importerList.length!=0)
    ) return;

    if (this.currentCountry == "") {
      this.showAlertForSearch(this.warningMsg.country);
      return;
    }
    if (this.direction == "") {
      this.showAlertForSearch(this.warningMsg.direction);
      return;
    }

    const modalRef = this.modalService.open(LocatorModalComponent, { windowClass: 'locatorModalClass' });
    (<LocatorModalComponent>modalRef.componentInstance).locatorType = type;
    (<LocatorModalComponent>modalRef.componentInstance).locatorObj = {
      country: this.currentCountry,
      type: this.direction,
      fromDate: this.fromDate,
      toDate: this.toDate
    };    

    const callBackRef = (<LocatorModalComponent>modalRef.componentInstance).callBack.subscribe(res => {
      if (type == 'exporter') this.exporterList = res;
      else this.importerList = res;

      callBackRef?.unsubscribe();
    });
  }

  rmLocData(item:any, type:string) {
    if (type == 'exporter' && this.exporterList.indexOf(item)>-1) {
      // this.exporter = '';
      this.exporterList.splice(this.exporterList.indexOf(item), 1);
    } else {
      // this.importer = '';
      if(this.importerList.indexOf(item)>-1) {
        this.importerList.splice(this.importerList.indexOf(item), 1);
      }
    }
  }


  //modify the table value as per the requirement
  modifyTableData(key:string, value:any): string {
    if([null, undefined].includes(value)) return "N/A";
    else if(key=="ProductDesc") {
      const productKeyword:string = this.tempProduct.length ? this.tempProduct[0] : this.product[0];
      return this.alertService.setHighlightToDesc(value, productKeyword);
    }
    else return `${value}`;
  }

  getTableHeads(key:any): string {
    if (this.currentCountry != "India") return key;
    else {
      const direction = this.apiBodyObj.base["direction"];
      const indiaHeadObjs = new CountryHeads().fetchCountryHeads(this.currentCountry)[direction];
      return indiaHeadObjs[key];
    }
  }


  //to scroll table left or right
  scrollTable(direction:string) {
    const tableBox = document.getElementById("tableContainer") as HTMLDivElement;
    const currentValue = tableBox.scrollLeft;

    if (direction == 'left') tableBox.scrollLeft = currentValue - 100;
    else tableBox.scrollLeft = currentValue + 100;
  }

  onDirectPagination(e:any, leftArrow:any, rightArrow:any, alertMsg:any) {
    if (e.key == "Enter" || e.code == "Enter") {
      if (Number(this.cpyCurrentPageNum) < 1) {
        this.cpyCurrentPageNum = this.currentPageNum + 1;
        return;
      }

      if (Number(this.cpyCurrentPageNum) > this.totalPages) {
        alertMsg.classList.add('active');
        setTimeout(() => alertMsg.classList.remove('active'), 3000);
        return;
      }

      if (Number(this.cpyCurrentPageNum) - 1 < this.currentPageNum) {
        this.currentPageNum = Number(this.cpyCurrentPageNum);
        leftArrow.click();
        return;
      } else if (Number(this.cpyCurrentPageNum) - 1 > this.currentPageNum) {
        const tempVal = Number(this.cpyCurrentPageNum);
        this.currentPageNum = Number(this.cpyCurrentPageNum) - 2;
        this.cpyCurrentPageNum = tempVal;
        rightArrow.click();
        return;
      }
    }
  }

  //pagination functions
  async onMovePagination(e:any, direction:string) {
    if (this.searchResult.length == 0) return;

    const directionTag = direction == 'right'
      ? e.target.previousSibling.previousSibling 
      : e.target.nextSibling.nextSibling;


    if (direction == 'right') {
      if (this.totalPages != 1) this.currentPageNum++;
      else if (this.totalPages == 1) { //if the result is not more than per page data then it will be disable and not further process
        e.target.classList.add('disable-direction');
        return;
      }
    } else this.currentPageNum--;

    this.isTableLoader = true; //if the result is more than per page then is it should show loader until it fetches further data

    if ((this.currentPageNum + 1) == this.totalPages || (this.currentPageNum + 1) == 1) { e.target.classList.add('disable-direction'); }

    if (directionTag.classList.contains('disable-direction') && this.totalPages != 1) {
      directionTag.classList.remove('disable-direction');
    }

    const currentObj = Object.keys(this.apiBodyObj.filter).length > 0 ? 'filter' : 'base';
    this.apiBodyObj[currentObj]["body"]["page"] = this.currentPageNum + 1;
    this.apiBodyObj[currentObj]["body"]["IsWorkspaceSearch"] = true;

    this.eventService.filterSidebarEvent.emit(false); //to display OFF to sidefilter options
    await this.getSearchData(this.apiBodyObj[currentObj], "pagination-arrow");
  }

  //to decide from the scretch about pageNum, total pages and records per page
  setCurrentTablePreview(filterArr: any[] = []) {
    const leftArrow = document.querySelector('.left-arr') as HTMLImageElement;
    const rightArrow = document.querySelector('.right-arr') as HTMLImageElement;
    leftArrow.classList.add('disable-direction');
    rightArrow.classList.remove('disable-direction');
  
    const totalData = this.searchResult.length > 0
      ? Number(this.counterObj.total) <= ALLOWED_RECORDS
        ? Number(this.counterObj.total) : ALLOWED_RECORDS : 1;
    this.totalPages = Math.ceil(totalData / this.pagePerView);

    this.currentPageNum = 0;

    this.onBindBookmark().then((res: any[]) => {
      this.perPageData = res;
      this.isTableLoader = false;
      this.scrollToTop();
    }).catch(err => console.log(err));
  }

  onSearchPerPage() {
    this.currentPageNum = 0;
    const currentObj = Object.keys(this.apiBodyObj.filter).length > 0 ? 'filter' : 'base';

    this.apiBodyObj[currentObj]["body"]["IsWorkspaceSearch"] = true;
    this.apiBodyObj[currentObj]["body"]["page"] = this.currentPageNum + 1;
    this.apiBodyObj[currentObj]["body"]["itemperpage"] = this.pagePerView;

    setTimeout(async () => {
      this.isTableLoader = true;
      this.eventService.filterSidebarEvent.emit(false); //to display OFF to sidefilter options

      await this.getSearchData(this.apiBodyObj[currentObj], "pagination-perpage");
    }, 1000);
  }

  scrollToTop() {
    const tableBox = document.getElementById("tableContainer") as HTMLDivElement;
    tableBox.scrollTop = 0;
    tableBox.scrollLeft = 0;
  }


  //on click td to show detailed model of specific data
  showDetailModal(data:any) {
    const countryHeadModal = new CountryHeads().fetchCountryHeads(this.currentCountry)[this.direction];
    const isModalAvail: boolean = Object.keys(countryHeadModal).length > 0;
    let tempArr = [];

    for (let key in { ...(isModalAvail ? countryHeadModal : data) }) {
      const temObj: any = {};
      temObj['key'] = isModalAvail ? countryHeadModal[key] : key;
      temObj['value'] = data[key];
      tempArr.push(temObj);
    }

    const modalRef = this.modalService.open(TableDataModalComponent, { windowClass: 'tableDataPopUpModalClass' });
    (<TableDataModalComponent>modalRef.componentInstance).tableData = tempArr;
  }


  //onClick bookmark icon to bookmark and to show if it is bookmarked---RecordID
  onSetBookmark = (e:any, data:any) => {
    if (!this.userService.getDataExistence(data['RecordID'])) {
      const favRemainPoints = Number(this.authService.getUserSingleDetail("Favoriteshipment"));
      if(favRemainPoints<1) {
        this.alertService.showPackageAlert("Oops!, It seems that you have used your all favorite shipment point. Please recharge your favorite shipment points.");
        return;
      }

      const bookmarkObj = {country: this.currentCountry, ...data};
      this.userService.setBookmarks(bookmarkObj)
      e.target.classList.remove("fa-regular");
      e.target.classList.add("fa-solid");
      this.updateFavoriteShipment();
    } else {
      this.userService.removeBookmarkData(data['RecordID']);
      e.target.classList.remove("fa-solid");
      e.target.classList.add("fa-regular");
    }
  };

  //binding all bookmarked item to table
  onBindBookmark() {
    return new Promise((resolve, reject) => {
      const updatedArr = [...this.perPageData];
      const bookmarkedArr = this.userService.getBookmarks();
      if (bookmarkedArr.length == 0) resolve(updatedArr);

      const mainKey = `${this.currentPageNum}-${this.pagePerView}`; //for selected data

      for (let i = 0; i < updatedArr.length; i++) {
        if (this.userService.getDataExistence(updatedArr[i]['RecordID'])) {
          updatedArr[i]['isBookmarked'] = true;
        } else updatedArr[i]['isBookmarked'] = false;

        //for the selected data (checkboxes)
        if (this.workstationCache.hasOwnProperty(mainKey)) {
          if (this.workstationCache[mainKey].hasOwnProperty(updatedArr[i]['RecordID'])) {
            updatedArr[i]['isChecked'] = true;
          }
        } else updatedArr[i]['isChecked'] = false;
      }

      //set the condition for the select all checkbox as per new page
      if (this.allSelectCheckedArr.includes(mainKey)) this.isMainChecked = true;
      else this.isMainChecked = false;

      resolve(updatedArr);
    });
  }


  //on the selection of table "select all checkbox button"
  onCheckboxAll = (e:any) => {
    this.isMainChecked = e.target.checked;
    const mainKey = `${this.currentPageNum}-${this.pagePerView}`;

    if (this.isMainChecked) {
      this.allSelectCheckedArr.push(mainKey);
      this.workstationCache[mainKey] = {};
    } else {
      const indexVal = this.allSelectCheckedArr.indexOf(mainKey);
      if (indexVal > -1) this.allSelectCheckedArr.splice(indexVal, 1);
      delete this.workstationCache[mainKey];
    }

    for (let i = 0; i < this.perPageData.length; i++) {
      if (this.isMainChecked) {
        this.workstationCache[mainKey][this.perPageData[i]['RecordID']] = this.perPageData[i];
      }
      this.perPageData[i]['isChecked'] = this.isMainChecked;
    }
  }


  //on click checkbox on given table grid data(for shipment and downloads)
  onClickCheckbox(e:any, data:any) {
    const isChecked = e.target.checked;
    const mainKey = `${this.currentPageNum}-${this.pagePerView}`;

    if (isChecked) {
      if (this.workstationCache.hasOwnProperty(mainKey)) {
        if (!this.workstationCache[mainKey].hasOwnProperty(data['RecordID'])) {
          this.workstationCache[mainKey][data['RecordID']] = data;
        }
      } else {
        this.workstationCache[mainKey] = {};
        this.workstationCache[mainKey][data['RecordID']] = data;
      }
    } else {
      delete this.workstationCache[mainKey][data['RecordID']];

      if (Object.keys(this.workstationCache[mainKey]).length == 0) {
        delete this.workstationCache[mainKey];
      }
    }
  }


  openSaveModal(options:any = undefined) {
    if (options == undefined) {
      const folderName = this.savedStatus.saveFolder;
      const modalRef = this.modalService.open(SaveFileComponent, { windowClass: 'saveFileModalClass' });
      (<SaveFileComponent>modalRef.componentInstance).targetBy = 'home';
      (<SaveFileComponent>modalRef.componentInstance).isAlreadySaved = this.savedStatus.isAlreadySaved;
      (<SaveFileComponent>modalRef.componentInstance).fileName = this.savedStatus.savedFileName;
      (<SaveFileComponent>modalRef.componentInstance).foldername = folderName == "" ? "default" : folderName;

      const eventRef = (<SaveFileComponent>modalRef.componentInstance).saveCallBack.subscribe(res => {
        this.alertService.saveInputValue(res?.fileName);
        this.savedStatus.isAlreadySaved = true;
        // this.savedStatus.saveFolder = res?.foldername;
        this.setBookmarkData(res);
        eventRef?.unsubscribe();
      });
    } else this.setBookmarkData(options);
  }

  setBookmarkData(res:any, eventType:string="workspace") {
    const cacheKey = `${environment.apiurl}api/getWorkSpace?UserId=${this.authService.getUserId()}`;
    const eventData = res;
    const queryData = {
      name: eventData?.fileName,
      start: this.fromDate,
      end: this.toDate,
      desc: this.product[0],
      type: this.direction,
      countryCode: this.currentCountryData?.code,
      countryType: this.currentCountryData?.type,
      buyer: this.importerList.toString(),
      vender: this.exporterList.toString(),
      tariffCode: this.hsCode,
      country: this.currentCountry,
      countries: this.selectedCountries,
      records: this.dataCounterTabs?.records,
      dateRange: this.dateRange,
      transaction: new Date().toISOString()
    };

    const apiObj = {
      UserId: this.authService.getUserId(),
      Searchbar: queryData,
      Sidefilter: this.selectedFilterCache,
      foldername: res?.foldername
    };
    this.apiService.addNewWorkspace(apiObj).subscribe({
      next: (res: any) => {
        if (!res?.error) {
          delete environment.apiDataCache[cacheKey];
  
          //to unselect all checkboxes
          this.isMainChecked = false;
          const checkedInput: any = document.querySelectorAll('input[type="checkbox"].mainSearchCheck:checked');
  
          for (let elem of checkedInput) elem.checked = false;
  
          for (let i = 0; i < this.perPageData.length; i++) {
            if (this.perPageData['isChecked']) {
              this.perPageData['isChecked'] = false;
            }
          }
  
          if (eventType != "download") this.workstationCache = {};
          this.allSelectCheckedArr = [];
          this.eventService.sendChoosenWorkspace.next({id: res["results"]["Id"], graphs: null});
        }
      }
    });
  }

  //it will revert to that scenario where we saved the data
  getLastSavedData(res:any) {
    const errorParams = [undefined, null, ""];
    if (res?.data?.tariffCode && res?.data?.tariffCode != "") {
      this.hsCode = res?.data?.tariffCode;
      this.hsCodeDigit = this.hsCode.length > 8 ? '8' : this.hsCode.length + '';
      this.getHsCodeData();
    }
    const otherSelectTag = document.getElementById('otherSelect') as HTMLDivElement;
    this.fromDate = res?.data?.start;
    this.toDate = res?.data?.end;
    this.direction = res?.data?.type;
    this.currentCountry = res?.data?.country;
    this.selectedCountries = res?.data?.countries || [];

    //to provide country details to company profile
    if (this.refreshPageName == "advance") {
      this.eventService.currentCountry.next({
        // country: "India",
        country: "",
        companyDirection: this.direction,
        type: "CUSTOM"
      });
    }

    //In case of India country is being used via workspace
    if (this.currentCountry == "India") {
      const directionTag = document.getElementById("firstSelect") as HTMLDivElement;
      directionTag.classList.remove("disable");
      this.firstSelectClass = "custom-dropdown";
      this.firstSelectVal = this.dropdownVal1.filter(item => item.value == this.direction)[0]["placeholder"];
      this.currentCountryData = { country: "India", code: "IND", direction: this.direction, type: "CUSTOM" };
      this.getSideFilterAccess(this.currentCountryData);
    }

    // this.importer = res?.data?.buyer;
    // this.exporter = res?.data?.vender;

    if(this.currentCountry=="India") this.getCountryLocator();
    else this.eventService.locatorDataMove.next([]);

    if (res?.data?.buyer) this.importerList = (res?.data?.buyer).split(",");
    if (res?.data?.vender) this.exporterList = (res?.data?.vender).split(",");

    this.product = errorParams.includes(res?.data?.desc) ? [] : [res?.data?.desc];
    this.dateRange = res?.data?.dateRange;

    this.savedStatus.isAlreadySaved = true;
    this.savedStatus.savedFileName = res?.data?.name;
    this.savedStatus.savedFileId = res?.fileRelated?.workspace_id; //fileRelated added on later
    this.savedStatus.saveFolder = res?.fileRelated?.foldername; //fileRelated added on later

    if (this.hsCode != "") {
      this.eventService.updateMultiselectDropDownEvent.next({
        targetFrom: "home-1",
        items: [res?.data?.tariffCode]
      });
    }

    for (let item of this.dropdownVal2) {
      if (item?.value == this.dateRange) {
        this.secSelectVal = item?.placeholder;
        if (item?.value != '6') this.togglePanelView(true);
        otherSelectTag.classList.remove('disable');
      }
    }

    this.refreshPageName = "";
    this.togglePanelView(true);
    this.selectedFilterCache = res?.filter;

    //==============setLastFilterSaved=================//
    const allKeys = Object.keys(this.selectedFilterCache);
    for (let i = 0; i < allKeys.length; i++) {
      if (this.selectedFilterCache[allKeys[i]].length == 0) {
        delete this.selectedFilterCache[allKeys[i]]; //deleting if value is [];
      }
    }
    //=================================================//
    this.inItSearchClickProcess("workspace").then(() => {
      this.filterOutTableData("workspace");
      this.eventService.savedWorkspaceEvent.next({});
    });
  }

  //to download selected or all given table records
  downloadRecords() {
    const numberOfSelectedRecords = this.getSelectedItemCount();
    const modalRef = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'downloadModalClass' });
    (<DownloadModelComponent>modalRef.componentInstance).modalType = 'download';
    (<DownloadModelComponent>modalRef.componentInstance).allDownloadNames = this.allDownloadNames;
    (<DownloadModelComponent>modalRef.componentInstance).numberOfRecords = numberOfSelectedRecords;
    (<DownloadModelComponent>modalRef.componentInstance).countryData = this.currentCountryData;
    (<DownloadModelComponent>modalRef.componentInstance).callBack.subscribe(res2 => {
      if (res2.status == 'DONE') {
        const dataObj = {
          direction: this.direction,
          countryType: this.currentCountryData?.type,
          recordIds: this.getSeletedItemIds(),
          filename: res2?.name,
          totalDownloadCost: res2?.remainingPoints|0,
          ...(Object.keys(this.apiBodyObj.filter).length > 0 ? this.apiBodyObj.filter["body"] : this.apiBodyObj.base["body"])
        }; //data related to download table

        //----------start loading animation--------------//
        // this.isDownloadingFile = true;
        //---------------------------------------------------//

        if (!dataObj.hasOwnProperty("CountryName")) dataObj["CountryName"] = this.currentCountry;
        if (!dataObj.hasOwnProperty("CountryCode")) dataObj["CountryCode"] = this.currentCountryData.code;
        dataObj["UserId"] = this.authService.getUserId();

        //to append new downloading file onto download box
        this.eventService.downloadListUpdate.next({ action: "add", status: "pending", filename: this.ellipsePipe.transform(dataObj?.filename, 22) });

        this.apiService.saveDownloadData(dataObj)
          .pipe(timeout(1000 * 60 * 15))
          .subscribe({
            next: (res: any) => {
              if (res != null && !res?.error) {
                //---------------------------to stop loader--------------------------------//
                setTimeout(() => {
                  //download success popup
                  const modalRef2 = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'downloadModalClass' });
                  (<DownloadModelComponent>modalRef2.componentInstance).modalType = 'download-msg';
                  this.eventService.userStatusEvent.emit('update');
                  this.eventService.downloadListUpdate.next({ action: "add", status: "done", filename: this.ellipsePipe.transform(dataObj?.filename, 22) });
                  //----------------------------------------------------------------------//
                }, 2000);
              }
            }, error: (err:any) => {
              console.log(err);
              this.eventService.downloadListUpdate.next({ action: "update", status: "failed", filename: this.ellipsePipe.transform(dataObj?.filename, 22) });
            }
          });
        }
    });
  }
  onGenerateDownloadLink() {
    if (!this.btnAccessibility.download) {
      this.alertService.showPackageAlert("Oops!, You appear to have used your all downloading points therefore you are not allowed to download data anymore.");
      return;
    }

    //if recoreds are not downloaded then save the searched records first before download
    if (!this.savedStatus.isAlreadySaved) {
      const modalRef = this.modalService.open(SaveFileComponent, { backdrop: "static", keyboard: false, windowClass: 'saveFileModalClass' });
      (<SaveFileComponent>modalRef.componentInstance).targetBy = 'download';
      (<SaveFileComponent>modalRef.componentInstance).isAlreadySaved = this.savedStatus.isAlreadySaved;
      (<SaveFileComponent>modalRef.componentInstance).saveCallBack.subscribe(res => {
        this.alertService.saveInputValue(res?.fileName);
        this.savedStatus.isAlreadySaved = res?.flag;
        this.savedStatus.saveFolder = res?.foldername;
        this.savedStatus.savedFileName = res?.fileName;
        this.setBookmarkData(res, "download");
        this.downloadRecords();
      });
    } else this.downloadRecords();
  }

  getSelectedItemCount(): number {
    if (Object.keys(this.workstationCache).length == 0) {
      return Number(this.counterObj.total);
    }

    let total = 0;

    for (let key in this.workstationCache) {
      total += Object.keys(this.workstationCache[key]).length;
    }
    return total;
  }

  //it provides all selected items' Ids from table to download
  getSeletedItemIds(): any[] {
    const idsArr = [];

    if (Object.keys(this.workstationCache).length > 0) {
      const mainKeys = Object.keys(this.workstationCache);

      for (let i = 0; i < mainKeys.length; i++) {
        const recordIds = Object.keys(this.workstationCache[mainKeys[i]]);
        idsArr.push(...recordIds);

        if (i == mainKeys.length - 1) {
          return idsArr;
        }
      }
    } else {
      return [];
    }
  }



  //====================== FILTER TABLE DATA ===========================//
  //this function will to remove duplicate keys of filters with values and also help to add new filters
  createBodyToFilter(obj:any): any {
    const copyObj = { ...obj };
    const objKeys = Object.keys(this.selectedFilterCache);

    //attaching country search values
    const mainSelectedCountries = [];
    this.selectedCountries.forEach(itemData => mainSelectedCountries.push(itemData["data"]));

    const countryType = this.direction=="export" ? "CountryofDestination" : "CountryofOrigin";
    if (this.hsCode != "" && !objKeys.includes("HsCode")) copyObj["HsCode"] = [this.hsCode];
    if (this.product.length > 0 && !objKeys.includes("ProductDesc")) copyObj["ProductDesc"] = this.product;
    if (this.exporterList.length > 0 && !objKeys.includes("Exp_Name")) copyObj["Exp_Name"] = this.exporterList;
    if (this.importerList.length > 0 && !objKeys.includes("Imp_Name")) copyObj["Imp_Name"] = this.importerList;
    if (this.selectedCountries.length > 0 && !objKeys.includes(countryType)) copyObj[countryType] = mainSelectedCountries;

    //initially main searched countries will be taken when search button is not clicked
    if (!this.isSearchBtnClicked && mainSelectedCountries.length > 0) copyObj[countryType] = mainSelectedCountries;

    for (let i = 0; i < objKeys.length; i++) {
      if (copyObj[objKeys[i]] != undefined && objKeys[i] != "Quantity") {
        const tempArr = Array.from(new Set([...copyObj[objKeys[i]], ...this.selectedFilterCache[objKeys[i]]]));
        copyObj[objKeys[i]] = tempArr;
      }
      else if (objKeys[i] == "Quantity") copyObj[objKeys[i]] = this.selectedFilterCache[objKeys[i]][0];
      else copyObj[objKeys[i]] = this.selectedFilterCache[objKeys[i]];
    }
    return copyObj;
  }


  filterOutTableData(callby:string) {
    this.currentSearchingMode = "filter";
    this.currentPageNum = 0;
    this.isFilteringData = true;
    this.apiBodyObj.filter = {
      country: this.currentCountry,
      direction: this.direction,
      countryType: this.currentCountryData?.type,
      body: this.createBodyToFilter({
        toDate: this.toDate,
        fromDate: this.fromDate,
        IsWorkspaceSearch: true,
        page: this.currentPageNum + 1,
        itemperpage: this.pagePerView,
        UserId: this.getRoleWiseId()
      })
    };

    // this.isTotalDataReceived = false;
    this.getSearchData(this.apiBodyObj.filter, callby).then((resolve: any) => {
      if (resolve.status == "done") this.setCurrentTablePreview();
    }).catch(error => console.log(error));
  }

  getCountryList() {
    this.apiService.getAllSearchCountries().subscribe({
      next: (res:any) => {
        if(!res?.error) {
          this.countriesList.base = res.results;
          this.countriesList.copy = res.results;
        }
      }, error: (err:any) => {console.log(err);}
    });
  }

  getProductWords(e:any, type:string) {
    if (e.key == "Enter" || e.code == "Enter") {
      if(type == "product") this.product = [this.word.toUpperCase()];

      this.word = "";
    }

    if (this.word.length >= 3 && type == "product") {
      this.isWordDropdown = true;
      this.apiService.getProductDescWords(this.word.toUpperCase()).subscribe({
        next: (res: any) => {
          if (!res.error && res.results.length > 0) {
            this.wordsArr = res?.results.splice(0, 10);
          }
        }
      });
    } else {
      const wordLen = this.countryWord.length;
      this.countriesList.copy = this.countriesList.base.filter(item => item?.country.substring(0, wordLen) == this.countryWord.toUpperCase());
    }
  }

  removeCountryWord(id:number)  {
    this.selectedCountries = this.selectedCountries.filter(item => id!=item?.id);
  }

  hideProductTimeout: any;
  onChooseOption(item:any, type:string) {
    if(this.hideProductTimeout) clearTimeout(this.hideProductTimeout);
    
    if(type == 'product') this.product = [(item["Product"]).toUpperCase()];
    else {
      const isExist:boolean = this.selectedCountries.filter(option => (option?.data).toUpperCase() == (item?.country).toUpperCase()).length==0;
      if(isExist) {
        const itemObj = {
          id: this.selectedCountries.length,
          data: (item["country"]).toUpperCase()
        };
        this.selectedCountries.push(itemObj); 
      }
    }

    this.isWordDropdown = false;
    this.isCountryDropdown = false;
    this.word = "";
    this.countryWord = "";
    this.countriesList.copy = this.countriesList.base;
  }
  hideProductBar = () => {
    this.hideProductTimeout = setTimeout(() => {
      this.isWordDropdown = false;
      this.isCountryDropdown = false;
    }, 500);
  }

  //calling this function to fetch full list of side filters
  getAllFullSideFilterData(callBy:string, apiData:any) {
    this.isFilteringData = true;
    const tempType = ["self"].includes(callBy) ? "base" : "filter";
    const filterApiBody = {
      ...(JSON.parse(JSON.stringify(this.apiBodyObj[tempType]["body"]))), 
      countryType: this.currentCountryData?.type,
      CountryCode: this.currentCountryData?.code,
      CountryName: this.currentCountryData?.country,
      Direction: this.currentCountryData?.direction,
      isSideFilter: false,
    };
    const tempUrlArr = this.apiService.getAllSideFilters(filterApiBody, this.filterAccess, true);

    const queryStr = `searchCountry=${this.currentCountry}&direction=${this.direction}&fromDate=${this.fromDate}&toDate=${this.toDate}&hscode=${this.hsCode}&product=${this.product}&buyer=${this.importerList.toString().replace(new RegExp(",","g"),"")}&supplier=${this.exporterList.toString().replace(new RegExp(",","g"),"")}&country=${this.countryWord}&query=${JSON.stringify(filterApiBody)}`;
    const apiKey = `${environment.apiurl}api/getFullAllSideFilter?${queryStr}`;

    if(environment.apiDataCache.hasOwnProperty(apiKey)) {
      const fullSideFiltersObj = environment.apiDataCache[apiKey];
      this.eventService.passFullSideFilterData.next(fullSideFiltersObj);
      this.getAnalysisData(apiData);
      setTimeout(() => this.isFilteringData = false, 2000);
    } else {
      this.eventSubscription10 = forkJoin(tempUrlArr).subscribe({
        next: (responses:any[]) => {
          setTimeout(() => {
            const fullSideFiltersObj = {};
            for(let i=0; i<responses.length; i++) {
              const keyArr = Object.keys(responses[i]?.results[0]);
              const objKey = keyArr[0]!="valueinusd" ? keyArr[0]: keyArr[1];
              fullSideFiltersObj[objKey] = responses[i]?.results;
            }
    
            fullSideFiltersObj["HsCode"] = this.sideFilterOptions["HsCode"];

            environment.apiDataCache[apiKey] = fullSideFiltersObj;
            this.eventService.passFullSideFilterData.next(fullSideFiltersObj);
            this.isFilteringData = false;
            this.getAnalysisData(apiData); //right now it has to be called at the very end coz it takes time where it is not required in the first place
          }, 2000);
        }, error: (err:any) => console.log(err)
      });
    }
  }

  onClickSelect(tag:HTMLSelectElement) {tag.click();}

  //getting all download names
  getDownloadNames() {
    this.apiService.getDownloadedRecord().subscribe({
      next: (res: any) => {
        if (!res.error && res.results.length > 0) {
          (res.results).forEach((item, index) => {
            this.allDownloadNames.push(item["workspacename"]);
          });
        }
      }, error: (err:any) => console.log(err)
    });
  }

  getAnalysisData(dataObj:any) {
    const bodyObj = { ...(dataObj["body"]) };
    this.analysisDataObj = { HsCode: [], Imp_Name: [], Exp_Name: [], Date: [], CountryOfOrigin: [], CountryOfDestination: [] };
    ["page", "itemperpage", "IsWorkspaceSearch", "UserId"].forEach(key => { if (bodyObj[key]) delete bodyObj[key] });
    const apiDataObj = {
      countryname: this.currentCountryData["country"] || "India",
      CountryCode: this.currentCountryData["code"] || "IND",
      countryType: this.currentCountryData?.type,
      direction: dataObj["direction"],
      ...bodyObj
    };
    const fieldName = ["HsCode", "Imp_Name", "Exp_Name", "Date",
    apiDataObj.direction=="import"? "CountryofOrigin": "CountryofDestination"];
    
    for(let i=0; i<fieldName.length; i++) {
      apiDataObj["fieldName"] = fieldName[i];
      const queryStr = `searchCountry=${this.currentCountry}&direction=${this.direction}&fromDate=${this.fromDate}&toDate=${this.toDate}&hscode=${this.hsCode}&product=${this.product}&buyer=${this.importerList.toString().replace(new RegExp(",","g"),"")}&supplier=${this.exporterList.toString().replace(new RegExp(",","g"),"")}&country=${this.countryWord}&query=${JSON.stringify(apiDataObj)}`;
      const apiKey = `${environment.apiurl}api/getAnalysisReport/${fieldName[i]}?${queryStr}`;

      if(environment.apiDataCache.hasOwnProperty(apiKey)) {
        this.analysisDataObj[fieldName[i]] = environment.apiDataCache[apiKey];
      } else {
        const newSubscription:Subscription = this.apiService.getAnalysisData(apiDataObj).subscribe({
          next: (res:any) => {
            if(!res.error) {
              const companyTempArr:any[] = JSON.parse(JSON.stringify(res.results));
              const arrLen:number = companyTempArr.length;
  
              if(["CountryofOrigin","CountryofDestination"].includes(fieldName[i])) {
                for(let j=0; j<arrLen; j++) { companyTempArr[j][fieldName[i]] = (<string>companyTempArr[j][fieldName[i]])?.toUpperCase()?.trim(); }
                this.analysisDataObj[fieldName[i]] = companyTempArr;
              } else {this.analysisDataObj[fieldName[i]] = res.results;}
              
              environment.apiDataCache[apiKey] = this.analysisDataObj[fieldName[i]];
            }
          }, error: (err:any) => console.log(err)
        });
        this.analysisApiSubscription.push(newSubscription);        
      }
    }

    // this.getAllFullSideFilterData(callBy);//call full side filter details
    this.eventService.setAnalysisDataEvent.next({body: apiDataObj, result: this.analysisDataObj});
  }


  setTableHeightDynamically(): string {
    if (this.isAnalysisTabActive) {
      if (!this.showLowerPanel && !this.isTabsVisible) return '78%';
      else if (!this.showLowerPanel && this.isTabsVisible) return '69%';
      else if (this.showLowerPanel && this.isTabsVisible) return '51%';
      else return '59%';
    } else {
      if (!this.showLowerPanel && !this.isTabsVisible) return '85%';
      else if (!this.showLowerPanel && this.isTabsVisible) return '76%';
      else if (this.showLowerPanel && this.isTabsVisible) return '58%';
      else return '67%';
    }
  }



  async showCounterModal(tabType: string, key: string) {
    if (["records","values"].includes(tabType)) return;
    
    const modalRef = this.modalService.open(SaveFileComponent, { backdrop: "static", keyboard: false, windowClass: 'saveFileModalClass counterFileModalClass' });
    (<SaveFileComponent>modalRef.componentInstance).currentModal = "counter-modal";
    (<SaveFileComponent>modalRef.componentInstance).listTitle = tabType == "code" ? "hs codes" : tabType;
    (<SaveFileComponent>modalRef.componentInstance).direction = this.direction;
    (<SaveFileComponent>modalRef.componentInstance).filterKey = key;
    const callBackRef = (<SaveFileComponent>modalRef.componentInstance).saveCallBack.subscribe((res: any) => {
      this.openCompanyProfile(tabType, res.company, false);
      callBackRef?.unsubscribe();
    });
  }

  openCompanyProfile(tabType:string, companyName:any, callByHtml:boolean=true) {
    const analysisTab = document.getElementById("analysisTab") as HTMLDivElement;
    if(callByHtml) { tabType = tabType=="Imp_Name" ? "buyers": "suppliers"; }

    const eventObj = {
      companyName: companyName,
      country: this.currentCountry,
      direction: this.direction,
      target: "navbar",
      selectedDate: this.toDate,
      tabDirectionType: tabType == "buyers" ? "buyer" : "supplier"
    };

    analysisTab.click();
    setTimeout(() => {
      this.eventService.companyProfileEvent.next(eventObj);
    }, 1000);
  }

  setGoogleLink(key:string, value:string): string {
    const query = key!="HsCode" 
      ? (value.trim()).replace(new RegExp(" ", "g"), "+") : `HS CODE ${value.trim()}`;
      
    return `https://www.google.com/search?q=${query}&ie=UTF-8`;
  }

  //to show mendatory alert pop up box
  showAlertMsg() {
    this.apiService.getAlertMessage().subscribe({
      next: (res: any) => {
        if (!res.error && res?.results.length>0) {
          const { txt_msg, start_date, end_date, status, show_popup } = res?.results[0];
          const startDateVal = new Date(start_date).valueOf();
          const endDateVal = new Date(end_date).valueOf();
          const currentDateVal = new Date().valueOf();

          if(status && show_popup && startDateVal<currentDateVal && currentDateVal<endDateVal) {
            setTimeout(() => {
              const modalRef = this.modalService.open(NotifyAlertMsgComponent, { backdrop: "static", keyboard: false, windowClass: 'saveFileModalClass alertModalClass' });
              (<NotifyAlertMsgComponent>modalRef.componentInstance).alertMsg = (JSON.parse(txt_msg))["popup"];
              const callBackRef = (<NotifyAlertMsgComponent>modalRef.componentInstance).saveCallBack.subscribe({
                next: (res: any) => callBackRef?.unsubscribe(),
                error: (err: any) => { }
              });
            }, 2000);
          }
        }
      },
      error: (err: any) => { }
    });
  }

  activeCountryDropDown(inpElem:HTMLInputElement) {
    setTimeout(() => inpElem.focus(), 250);
    this.isCountryDropdown=true;
  }

  //to stop frequent popup of the companies
  onHoverDropdown(isOver:boolean, type:string) {
    if(isOver) this.isOverDropItem = true;
    else this.isOverDropItem = false;
  }

  includeTariffCode(apiData:any, callBy:string) {
    if(callBy=="filter") return;

    const tariffCode = this.authService.getUserDetails()["TarrifCodeAccess"];
    if(tariffCode!="All") {
      if(!(apiData["body"]).hasOwnProperty("HsCode")) {
        apiData["body"]["HsCode"] = tariffCode.split(",");
      }
    }
  }

  async getUserCurrentIP() {
    try {
      const response2 = await fetch("https://geolocation-db.com/json");
      const geoLocationRes = await response2.json();
      this.userNetworkDetails["Location"] = (<string>geoLocationRes["country_name"]).toUpperCase().substring(0,3);
    } catch (error) {console.log(error);}
  
    const response1 = await fetch("https://api.ipify.org/?format=json");
    const ipRes = await response1.json();
    this.userNetworkDetails["IP"] = ipRes["ip"];
    this.userNetworkDetails["UserId"] = this.authService.getUserId();
    this.userNetworkDetails["Searchcount"] = 1;
  }

  onSetUserSearchLog(jsonData:string) {
    this.userNetworkDetails["Searchhistory"] = jsonData;
    this.apiService.setUserSearchLog(this.userNetworkDetails).subscribe({
      next: (res:any) => {
        if(!res.error) {console.log(res);}
      }, error: (err:any) => console.log(err)
    });
  }

  updateFavoriteShipment() {
    const currentUserId = this.authService.getUserId();
    this.apiService.updateFavoriteShipmentPoints(currentUserId).subscribe({
      next: (res:any) => {
        const remainingPoints = res.results["remaining"];
        this.authService.updateUserDetails("Favoriteshipment", remainingPoints);
      }, error: (err:any) => console.log(err)
    });
  }

  ///////////////////////////////////////////// column alteration ////////////////////////////  
  preferedTableColHeads = {};
  alterTableHeads:string[] = [];
  preferedColumnOrderArr:string[] = [];
  isAlterColListShown:boolean = false;
  isColumnExchangeInProcess:boolean = false;

  colShifterInit() {
    $("#colShifter").tableDnD({
      onDragStop: (p:HTMLTableElement) => {
        this.preferedColumnOrderArr = [];
        $(p).children().each((idx:number, element:HTMLTableRowElement) => {
          const headKey = element.id;
          this.preferedColumnOrderArr.push(headKey);
        });
      }
    });
  }

  onTickCheckbox(headKey:string) {
    this.preferedTableColHeads[headKey] = !this.preferedTableColHeads[headKey];
  }
  selectAllCols() {Object.keys(this.preferedTableColHeads).forEach(key => this.preferedTableColHeads[key] = true);}
  submitColsOrderToUserPreference() {
    this.isColumnExchangeInProcess = true;
    const userPref = JSON.parse(this.authService.getUserSingleDetail("userPreference")) || {};
    
    if (!userPref.hasOwnProperty("tableOrderedCols")) {
      userPref["tableOrderedCols"] = {};
      userPref["tableOrderedCols"][this.currentCountry] = {};
    }

    userPref["tableOrderedCols"][this.currentCountry][this.direction] = {      
      activeCols: this.preferedTableColHeads,
      orderedCols: this.preferedColumnOrderArr
    };
    const jsonPrefs = JSON.stringify(userPref);

    this.userService.updateUserPereference(jsonPrefs).subscribe({
      next: (res:ApiMsgRes) => {
        if(!res.error) {
          this.authService.updateUserDetails("userPreference", jsonPrefs);
          setTimeout(() => this.arrangeTableHeads(), 1000);
        }
      }, error: (err:any) => {console.log(err)}
    });
  }

  backToPrevState() {
    const userPref = JSON.parse(this.authService.getUserSingleDetail("userPreference")) || {};
    if(
      userPref.hasOwnProperty("tableOrderedCols") && 
      userPref["tableOrderedCols"].hasOwnProperty(this.currentCountry) &&
      userPref["tableOrderedCols"][this.currentCountry].hasOwnProperty(this.direction)
    ) {
      const {activeCols, orderedCols} = userPref["tableOrderedCols"][this.currentCountry][this.direction];
      this.preferedTableColHeads = JSON.parse(JSON.stringify(activeCols));
      this.preferedColumnOrderArr = [...orderedCols];
      this.alterTableHeads = [...this.preferedColumnOrderArr];
    } else {
      this.tableHeads.forEach(key => this.preferedTableColHeads[key] = true);
      this.preferedColumnOrderArr = [...this.tableHeads];
    }
  }

  arrangeTableHeads() {
    const userPref = JSON.parse(this.authService.getUserSingleDetail("userPreference")) || {};
    if(this.currentCountry == 'India') {
      if(
        userPref.hasOwnProperty("tableOrderedCols") && 
        userPref["tableOrderedCols"].hasOwnProperty(this.currentCountry) &&
        userPref["tableOrderedCols"][this.currentCountry].hasOwnProperty(this.direction)
      ) {
        const {activeCols, orderedCols} = userPref["tableOrderedCols"][this.currentCountry][this.direction];
        this.tableHeads = orderedCols.filter((headKey:string) => activeCols[headKey]);
      } else {
        this.tableHeads = Object.keys(new CountryHeads().fetchCountryHeads(this.currentCountry)[this.direction]);        
        this.tableHeads.forEach(key => this.preferedTableColHeads[key] = true);
      }
    } else {}

    this.isColumnExchangeInProcess = false;
  }

  onTapCheckVal(event:any) {
    const tdTag = event.target;
    tdTag.previousSibling.firstChild.click();
  }

  showAlterColList() {
    this.isAlterColListShown = !this.isAlterColListShown;
    if(!this.isAlterColListShown) this.backToPrevState();
  }

  disableLocatorBar(countryRes:any) {
    $("#supplierLocatorBox").removeClass("inactive");
    $("#buyerLocatorBox").removeClass("inactive");
    
    if(Object.keys(countryRes).length>0 && !["","India"].includes(countryRes?.country)) {
      const {country, direction} = countryRes;
      const countryObj = new CountryHeads();
      const countryInfo = countryObj.fetchCountryHeads(country);
      const locatorFlags = countryInfo["locators"][direction];
      
      if(!locatorFlags["Exp_Name"]) $("#supplierLocatorBox").addClass("inactive");
      if(!locatorFlags["Imp_Name"]) $("#buyerLocatorBox").addClass("inactive");
    }
  }
}

