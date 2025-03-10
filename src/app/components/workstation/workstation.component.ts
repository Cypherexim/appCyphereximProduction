import { Component, OnInit, Input, OnChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription, takeUntil, interval } from 'rxjs';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { TableDataModalComponent } from '../homepage/components/table-data-modal/table-data-modal.component';
import { ConfirmationComponent } from './modals/confirmation/confirmation.component';
import { AlertifyService } from 'src/app/services/alertify.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { UserRoleAccess } from 'src/app/models/plan';
import { CountryHeads } from 'src/app/models/country';

@Component({
  selector: 'app-workstation',
  templateUrl: './workstation.component.html',
  styleUrls: ['./workstation.component.css']
})
export class WorkstationComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  tableHeads: string[] = ['name', 'country', 'search type', 'traffic code', 'buyer', 'supplier', 'commodity description', 'records', 'start', 'end', 'date', 'delete'];
  tableHeads2: string[] = ["Date", "HsCode", "ProductDesc", "Imp_Name", "Exp_Name", "Quantity", "CountryofDestination", "CountryofOrigin", "Month", "Year", "uqc", "Mode", "Currency", "Quantity"];

  @Input() type: string = '';
  folderViewType:string = this.userService.getSingleUserPref('folderView') || "list";
  favouriteDataArr: any[] = [];
  workspaceDataArr: any[] = [];
  downloadDataArr: any[] = [];
  copyDataArr: any[] = [];
  directionType: string = "";
  filterDates = { start: '', end: '' };
  isLoading: boolean = true;
  currentDirName: string = "default";
  openWorkSpaceTable: boolean = false;
  isAnalysisTabActive: boolean = false;
  isDownloadingAllowed: boolean = true;
  isMultipleSharing:boolean = false;
  isAllSelected:boolean = false;
  fileIds:any[] = [];

  allCountries: any[] = []; //temporary

  userRights: UserRoleAccess = new UserRoleAccess();

  searchBars: any = {
    download: ['name', 'country', 'direction'],
    workspace: ['name', 'country', 'type', 'date']
  }

  workspaceFolders: string[] = [];

  apiSubscription1:Subscription;
  apiSubscription2:Subscription;

  eventSubscription: Subscription;
  eventSubscription2: Subscription;
  eventSubscription3: Subscription;
  intervalSubscription: Subscription;
  destroy$: Subject<any> = new Subject<any>();
  ellipsePipe: EllipsisPipe = new EllipsisPipe();
  // workspaceThCss = (head):any => { return {width: head=='buyer'||head=='vender'||head=='name'?'10%': head=='country'?'6%':'auto'}}
  favouritePoints = 0;

  constructor(
    private userService: UserService,
    private apiService: ApiServiceService,
    private modalService: NgbModal,
    private authService: AuthService,
    private alertService: AlertifyService,
    private datePipe: DatePipe,
    private eventService: EventemittersService,
  ) { }


  ngOnChanges() {
    this.workspaceFolders = [];
    this.favouritePoints = Number(this.authService.getUserSingleDetail("Favoriteshipment"));

    if (this.type == 'favourites') {
      const bookmarkedData = this.userService.getBookmarks();
      this.favouriteDataArr = bookmarkedData.data;
      console.log(this.favouriteDataArr)
      this.isLoading = false;
    } else if (this.type == 'workspace') this.onWorkspaceInIt();
    else if (this.type == 'download') this.onDownloadListInIt();

    this.setDownloadInterval();
  }

  setDownloadInterval() {
    if (this.type == "download") {
      this.intervalSubscription = interval(10000)
      .subscribe(() => this.onDownloadListInIt());
    }
  }

  onDownloadListInIt() {
    this.eventService.downloadListUpdate.next({ action: "remove" });
    this.apiSubscription1 = this.apiService.getDownloadedRecord().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res != null && !res?.error) {
        this.downloadDataArr = this.getSortedArray(res?.results, "datetime");
        this.copyDataArr = this.downloadDataArr;
        this.isLoading = false;
      }
    });
  }

  async onWorkspaceInIt() {
    const cacheKey = `${environment.apiurl}api/getWorkSpace?UserId=${this.authService.getUserId()}`;

    if (environment.apiDataCache.hasOwnProperty(cacheKey)) {
      this.workspaceDataArr = environment.apiDataCache[cacheKey];
      this.isLoading = false;
      const data = [...this.workspaceDataArr];
      this.workspaceFolders = await this.userService.getWorkspaceFolder();

      for (let i = 0; i < data.length; i++) this.setDataToWorkspaceFolder(data[i]);

    } else {
      this.apiSubscription2 = this.apiService.getWorkspace().pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
        if (res != null && !res?.error) {
          this.userService.removeWorkspaceFolder(); // to remove alreday exist foldernames          
          const modifiedObj = await this.alertService.getModifiedWorkspace(res?.results);
          const data = modifiedObj.modifiedArr;
          const sortedFolderNames = modifiedObj.folderNames.sort();
          this.eventService.userWorkspaceFolders.next(sortedFolderNames);//to pass given folder names

          for (let i = 0; i < sortedFolderNames.length; i++) {
            await this.userService.setWorkspaceFolder(sortedFolderNames[i]);
            if (i == sortedFolderNames.length - 1) this.workspaceFolders = await this.userService.getWorkspaceFolder();
          }

          for (let i = 0; i < data.length; i++) {
            data[i]['Searchbar'] = JSON.parse(data[i]['Searchbar']);
            data[i]['Sidefilter'] = JSON.parse(data[i]['Sidefilter']);

            this.setDataToWorkspaceFolder(data[i]);
          }

          this.workspaceDataArr = this.getSortedArray(data, "transaction");
          environment.apiDataCache[cacheKey] = this.workspaceDataArr;
          this.isLoading = false;
        }
      });
    }
  }

  ngOnInit(): void {
    // this.folderViewType = this.userService.getSingleUserPref('folderView');

    this.eventSubscription = this.eventService.confirmationEvent.subscribe(res => {
      if (res) {
        const bookmarkedData = this.userService.getBookmarks();
        this.favouriteDataArr = bookmarkedData.data;
      }
    });

    //temporary
    this.userService.getCountrylist().subscribe((res: any) => {
      if (res != null) {
        this.allCountries = res?.results;
      }
    });


    //on changing of tab from table to analysis or vice-versa
    this.eventSubscription2 = this.eventService.dataTabChngEvent.subscribe(res => {
      this.isAnalysisTabActive = res;
    });

    this.eventSubscription3 = this.eventService.downloadListUpdate.subscribe((res: any) => {
      if(Object.keys(res).length > 0) this.onDownloadUpdateEvent(res);
    });

    this.eventService.userAccessRights.subscribe((res: any) => {
      if (!res.error) this.userRights = res;
    });
  }

  setViewType = (type:string) => {
    this.folderViewType = type;
    this.userService.setUserPref('folderView', type);
  }

  setDataToWorkspaceFolder(data: any) {
    for (let i = 0; i < this.workspaceFolders.length; i++) {
      if (this.workspaceFolders[i]["folder"] == data["foldername"]) {
        this.workspaceFolders[i]["data"].push({ ...data });
      }
    }
  }

  openWorkSpaceFolder(foldername: string) {
    const currentFolderData = this.workspaceFolders.find(item => item["folder"] == foldername)["data"];
    this.copyDataArr = this.getSortedArray(currentFolderData, "transaction");
    this.openWorkSpaceTable = true;
    this.currentDirName = foldername;
  }

  backToFolders() {
    this.openWorkSpaceTable = false;
    this.copyDataArr = [];
  }


  onDownloadUpdateEvent(res) {
    if (res?.action == "highlight") {
      const selector = `div#downloadTable table tbody tr[title="${res?.filename}"]`;
      const selectedTr = document.querySelector(selector) as HTMLTableRowElement;
      if (selectedTr) {
        selectedTr.classList.add("blinkData");
        setTimeout(() => selectedTr.classList.remove("blinkData"), 3000);
        this.eventService.downloadListUpdate.next({});
      } else {
        setTimeout(() => this.onDownloadUpdateEvent(res), 1500);
      }
    }
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    if(this.apiSubscription1) {this.apiSubscription1.unsubscribe();}
    if(this.apiSubscription2) {this.apiSubscription2.unsubscribe();}
    this.eventSubscription.unsubscribe();
    this.eventSubscription2.unsubscribe();
    this.eventSubscription3.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    if (this.intervalSubscription) this.intervalSubscription.unsubscribe();
  }

  getHeadsValue(data:any, key:string): string {
    if (key == "Date") return this.datePipe.transform(data[key], "yyyy-MM-dd");
    else {
      if (data[key]) return data[key];
      else return "N/A";
    }
  }

  //on click table data info icon
  changeInfo(e, type) {
    const imgPath = 'assets/images/';

    if (type == 'in') e.target.setAttribute('src', imgPath + 'info2.png');
    else e.target.setAttribute('src', imgPath + 'info.png');
  }

  //on click td to show detailed model of specific data
  showDetailModal(data:any) {
    const {country, Type} = data;
    const countryHeadModal = new CountryHeads().fetchCountryHeads(country)[Type.toLowerCase()];
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

  onRemoveItem(e:any, dataId:any) {
    const modalRef = this.modalService.open(ConfirmationComponent, { windowClass: 'confirmModalClass' });
    (<ConfirmationComponent>modalRef.componentInstance).dataId = dataId;
  }

  gotoSearch(data:any, filter:any, ...args) {
    const fileRelated = {workspace_id: args[0], foldername: args[1]};
    const selectedOne = this.allCountries.filter(item => item?.CountryName == data?.country);

    const dataObj = { country: data?.country, direction: data?.type, code: selectedOne[0]['Countrycode'] };
    this.eventService.savedWorkspaceEvent.next({ data, filter, fileRelated });

    this.eventService.currentCountry.next(dataObj);
    // if (data?.country != "India") this.eventService.currentCountry.next(dataObj);
    // else this.eventService.currentCountry.next({ code: "IND", direction: data?.type });

    this.eventService.headerClickEvent.emit('home');
    this.eventService.sendChoosenWorkspace.next({ id: args[0], graphs: args[2] });
  }


  downloadFile(data) {
    // if (this.isDownloadingAllowed) {
      if(![""," ",null,undefined].includes(data["expirydate"])) {
        const expiredDateValue = new Date(data["expirydate"]).valueOf();
        const todayDateValue = new Date().valueOf();
        
        if (todayDateValue < expiredDateValue) { window.open(data?.filePath, "_blank"); }
        else this.alertService.showWarningAlert("Your request could not be completed. your file is expired. Contact to the service provider.");
      } else this.alertService.showWarningAlert("Your request could not be completed. your file is expired. Contact to the service provider.");
    // } 
  }

  onFilterSearch(tableType, searchType, event) {
    const data = (event.target.value).toLowerCase();

    if (tableType == 'download' && typeof data == 'string') {
      const itemKey = searchType == "name"
        ? "workspacename" : searchType == "type"
          ? "direction" : "countryname";
      const searchedItems = this.downloadDataArr.filter(item => (item[itemKey].substring(0, data.length)).toLowerCase() == data);
      this.copyDataArr = searchedItems;
    } else if (tableType == 'workspace' && typeof data == 'string') {
      const tempWorkspaceArr = this.workspaceFolders.filter(item => item["folder"] == this.currentDirName)[0]["data"];
      const itemKey = searchType == "name"
        ? "name" : searchType == "type"
          ? "type" : searchType == "country" ? "country" : searchType;

      const searchedItems = !['start', 'end'].includes(itemKey)
        ? tempWorkspaceArr.filter(item => ((item["Searchbar"][itemKey]).substring(0, data.length)).toLowerCase() == data)
        : data != "" ? tempWorkspaceArr.filter(item => item["Searchbar"][itemKey] == this.datePipe.transform(data, 'yyyy-MM-dd')) : tempWorkspaceArr;

      this.copyDataArr = this.getSortedArray(searchedItems, "transaction");
    }
  }

  getEllipsedTd(data): string {
    try {
      if (data.length > 30) {
        return this.ellipsePipe.transform(data, 30);
      } else return data;
    } catch (error) {
      return "N/A";
    }
  }

  getSortedArray(dataArr: any[], key) {
    return dataArr.sort(function (a, b) {
      const aDate: any = new Date(key == "transaction" ? a["Searchbar"][key] : a[key]);
      const bDate: any = new Date(key == "transaction" ? b["Searchbar"][key] : b[key]);

      return bDate - aDate;
    });
  }

  onClickDelete(id, filename) {
    const cacheKey = `${environment.apiurl}api/getWorkSpace?UserId=${this.authService.getUserId()}`;

    const modalRef = this.modalService.open(ConfirmationComponent, { windowClass: 'confirmModalClass' });
    (<ConfirmationComponent>modalRef.componentInstance).dataId = id;
    (<ConfirmationComponent>modalRef.componentInstance).deleteType = "delete";
    (<ConfirmationComponent>modalRef.componentInstance).confirmationMsg = `Are you sure to delete workspace (${filename})`;
    const callBackEvent = (<ConfirmationComponent>modalRef.componentInstance).callBack.subscribe(res => {
      if (res) {
        delete environment.apiDataCache[cacheKey];
        this.openWorkSpaceTable = false;
        this.isLoading = true;
        this.onWorkspaceInIt();
        callBackEvent.unsubscribe();
      }
    });
  }

  onClickShare(id) {
    if(this.fileIds.length == 0) return;
    
    const modalRef = this.modalService.open(ConfirmationComponent, { windowClass: 'confirmShareModalClass' });
    (<ConfirmationComponent>modalRef.componentInstance).downloadWorkspaceId = id!=null ? id : this.fileIds;
    (<ConfirmationComponent>modalRef.componentInstance).currentPopUp = "sharing";
    const callBackEvent = (<ConfirmationComponent>modalRef.componentInstance).callBack.subscribe(res => {
      callBackEvent.unsubscribe();
    });
  }

  selectOneByOne(id) {
    if(this.fileIds.includes(id)) this.fileIds.splice(this.fileIds.indexOf(id), 1);
    else this.fileIds.push(Number(id)); 
    
    if(this.intervalSubscription) this.intervalSubscription.unsubscribe();
  }
  selectAllItems(e) {
    this.fileIds = [];
    this.isAllSelected = e.target.checked;
    if(this.isAllSelected) this.copyDataArr.map(item => {
      if(item?.status=="Completed") this.fileIds.push(item?.Id);
    });

    if(this.intervalSubscription) this.intervalSubscription.unsubscribe();
    // this.isMultipleSharing = !this.isMultipleSharing;
    // if(!this.isAllSelected) this.setDownloadInterval();
    // else { if(this.intervalSubscription)this.intervalSubscription.unsubscribe(); }
  }

  setGoogleLink(company: string): string {
    const query = (company.trim()).replace(new RegExp(" ", "g"), "+");
    return `https://www.google.com/search?q=${query}&ie=UTF-8`;
  }
}

