import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DownloadModelComponent } from 'src/app/components/homepage/components/download-model/download-model.component';
import { SideFilterAccessModel } from 'src/app/models/others';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { UserService } from 'src/app/services/user.service';
import { EditModalComponent } from './components/edit-modal/edit-modal.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-other-list',
  templateUrl: './other-list.component.html',
  styleUrls: ['./other-list.component.css']
})
export class OtherListComponent implements OnInit, OnChanges, AfterViewInit { 
  @Input() pageHeadName:string = "country";
  allSideFilterList:any[] = [];
  sideAccessKeys:string[] = ["HsCode", "ProductDesc", "Exp_Name", "Imp_Name", "CountryofDestination", "CountryofOrigin", "PortofOrigin", "PortofDestination", "Mode", "uqc", "Quantity", "Currency", "Month", "Year", "LoadingPort", "NotifyPartyName"];

  allCountryList:any[] = [];
  countryList:any[] = [];
  dropdownCountries:any[] = [];
  updateBtn:string = "UPDATE";
  errorMsg:string = "";
  errorTimeout:any;
  countryType:string = "CUSTOM";
  tableHeads = {
    country: ["country", "direction", "active", "action"],
    date: ["country", "direction", "last update", "action"]
  };
  selectedCountryValue:string = "";
  filterHeads:string[] = [];
  countryDateObj = {
    countryCode: "",
    countryName: "",
    direction: "", 
    latestDate: "",
    countryType: ""
  };
  isLoading:boolean = false;
  hasSelected = {
    type: false,
    country: false,
    direction: false,
  }

  sideFilterAccess:SideFilterAccessModel = new SideFilterAccessModel();
  
  constructor(
    private userService: UserService,
    private modalService: NgbModal,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnInit(): void {
    if(this.pageHeadName==="country") this.getCountryList();
  }

  ngAfterViewInit(): void {}

  onClickCountryType(type:string) {
    if(type==="type" && this.countryDateObj.countryType !== "") {
      this.hasSelected.type = true;      
      this.getAllDropdownCountry();
    } else if(type == "country")  {
      const [code, name] = this.selectedCountryValue.split("~");
      this.countryDateObj.countryCode = code;
      this.countryDateObj.countryName = name;
      this.hasSelected.country = true;
    }
  }

  getLastUpdatedDate() {
    const {countryCode, direction, countryType} = this.countryDateObj;
    this.apiService.getCountryLatestDate({country: countryCode, direction, countryType}).subscribe({
      next: (res:any) => {
        this.hasSelected.direction = true;
        if(!res.error && res?.results.length > 0) {
          this.countryDateObj.latestDate = this.alertService.dateInFormat(res.results[0]["LatestDate"]);
        } else this.countryDateObj.latestDate = "";
      }, error: (err:any) => console.log(err)
    });
  }

  getAllDropdownCountry() {
    this.apiService.getAllAdminCountries(this.countryDateObj.countryType).subscribe({
      next: (res:any) => {        
        if(!res.error) this.dropdownCountries = res?.results;
      },
      error: (err:any) => {console.log(err);}
    });
  }

  getAllSideFilterAccess() {
    this.isLoading = true;
    const cacheKey = `${environment.apiurl}api/getAllSideFilterAccess?type=${this.countryType}`
    
    if(environment.apiDataCache.hasOwnProperty(cacheKey)) {
      this.allSideFilterList = environment.apiDataCache[cacheKey];
      setTimeout(() => this.isLoading = false, 1000);
    } else {
      this.apiService.getAllSideFilterAccess(this.countryType).subscribe((res:any) => {
        if(!res?.error && res?.results.length>0) {
          this.allSideFilterList = res?.results;
          environment.apiDataCache[cacheKey] = this.allSideFilterList;
          setTimeout(() => this.isLoading = false, 1000);
        } else {
          this.allSideFilterList = [];
          this.isLoading = false;
        }
      });
    }
  }

  getCountryList() {
    this.isLoading = true;
    this.allCountryList = [];
    const countryAPIkey = `${environment.apiurl}/api/getContries`;

    if((environment.apiDataCache).hasOwnProperty(countryAPIkey)) {
      this.countryList = environment.apiDataCache[countryAPIkey];
      this.getAllSideFilterAccess();
    } else {
      this.userService.getCountrylist().subscribe(res =>{
        if(!res?.error && res?.code == 200) {
          this.countryList = res?.results;
          this.getAllSideFilterAccess();
          environment.apiDataCache[countryAPIkey] = JSON.parse(JSON.stringify(res.results));
        }
      });
    }
  }

  setAllCountryArr(res:any, i:any, key:any) {
    const tempItem = {...res[i]};
    delete tempItem[key];
    this.allCountryList.push(tempItem);
  }

  setDefaultFilter(code:string, direction:string) {
    const defaultSideFilterAccess = new SideFilterAccessModel();
    Object.keys(defaultSideFilterAccess).forEach(key => defaultSideFilterAccess[key] = false);

    defaultSideFilterAccess.Country = code;
    defaultSideFilterAccess.Direction = direction;
    
    return {...defaultSideFilterAccess};
  }


  updateLatestDate() {
    const {countryName, direction, latestDate, countryType, countryCode} = this.countryDateObj;
    if([countryName, direction, latestDate, countryType, countryCode].includes("")) {
      this.errorMsg = "Please fill all the required fields";
      
      if(this.errorTimeout) clearTimeout(this.errorTimeout);
      this.errorTimeout = setTimeout(() => this.errorMsg = "", 2000);
      
      return;
    }
    
    this.updateBtn = "UPDATING..."
    
    this.apiService.updateCountryDate(this.countryDateObj).subscribe((res:any) => {
      if(!res.error) {
        const modalRef2 = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'downloadModalClass', centered: true });
        (<DownloadModelComponent>modalRef2.componentInstance).modalType = "updateDate-msg";
        (<DownloadModelComponent>modalRef2.componentInstance).customMsg = `${this.countryDateObj.countryName}-${this.countryDateObj.direction} latest date has been updated successfully!`;

        this.updateBtn = "UPDATE";
        this.countryDateObj = {
          countryCode: "",
          countryName: "",
          direction: "",
          latestDate: "",
          countryType: ""
        };
      }
    });
  }

  updateSideFilterAccess(e:any, key:string, data:any) {
    const flagBool = e.target.checked;
    data[key] = flagBool;
    
    this.apiService.addUpdateSideFilterAccess(data).subscribe((res:any) => {
      if(!res.error) this.alertService.success(`${data?.country_name} sidefilter Updated!`);
      else this.alertService.error(res.message);
    });
  }

  getFormModal() {
    const modalRef = this.modalService.open(EditModalComponent, { backdrop: "static", keyboard: false, windowClass: 'addUpdateCountry', centered: true });
    (<EditModalComponent>modalRef.componentInstance).isUpdateMode = false;    
    const modalRef2 = (<EditModalComponent>modalRef.componentInstance).callback.subscribe(res => {
      this.isLoading = true;
      this.getCountryList(); 
      modalRef2.unsubscribe();
    });
  }

  getFormUpdateModal(Countrycode:string) {
    const data = this.countryList.filter(item => item["Countrycode"] == Countrycode)[0];
    
    const modalRef = this.modalService.open(EditModalComponent, { backdrop: "static", keyboard: false, windowClass: 'addUpdateCountry', centered: true });
    (<EditModalComponent>modalRef.componentInstance).isUpdateMode = true;
    (<EditModalComponent>modalRef.componentInstance).currentCountryObj = data;
    const modalRef2 = (<EditModalComponent>modalRef.componentInstance).callback.subscribe(res => {
      this.isLoading = true;
      this.getCountryList(); 
      modalRef2.unsubscribe();
    });
  }

  showSideFilterDetail(data:any) {
    const modalRef = this.modalService.open(EditModalComponent, { backdrop: "static", keyboard: false, windowClass: 'addUpdateCountry', centered: true });
    (<EditModalComponent>modalRef.componentInstance).sideFilterData = data;
    (<EditModalComponent>modalRef.componentInstance).isCountryForm = false;
  }


}
