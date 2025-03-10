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
  allCountryList:any[] = [];
  countryList:any[] = [];
  dropdownCountries:any[] = [];
  updateBtn:string = "UPDATE";
  errorMsg:string = "";
  errorTimeout:any;
  tableHeads = {
    country: ["country", "direction", "active", "action"],
    date: ["country", "direction", "last update", "action"]
  };
  filterHeads:string[] = [];
  countryDateObj = {
    countryName: "", 
    direction: "", 
    latestDate: ""
  };
  isLoading:boolean = false;

  sideFilterAccess:SideFilterAccessModel = new SideFilterAccessModel();
  
  constructor(
    private userService: UserService,
    private modalService: NgbModal,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if(this.pageHeadName == "country") {
      const copyObj = {...this.sideFilterAccess};
      delete copyObj["Country"];
      delete copyObj["Direction"];
      const allAccessHeads = Object.keys(copyObj);
      
      this.filterHeads = [...allAccessHeads];

      this.tableHeads.country = [...this.tableHeads.country.splice(0, 2), ...allAccessHeads, ...this.tableHeads.country];
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.getCountryList();
    this.getAllDropdownCountry();
  }

  ngAfterViewInit(): void {
    
  }

  getLastUpdatedDate() {
    const {countryName, direction} = this.countryDateObj;
    this.apiService.getCountryLatestDate({country: countryName, direction}).subscribe((res:any) => {
      if(!res.error && res?.results.length > 0) {
        this.countryDateObj.latestDate = this.alertService.dateInFormat(res.results[0]["LatestDate"]);
      } else this.countryDateObj.latestDate = "";
    });
  }

  getAllDropdownCountry() {
    this.apiService.getAllAdminCountries().subscribe({
      next: (res:any) => {
        if(!res.error) this.dropdownCountries = res?.results;
      },
      error: (err:any) => {console.log(err);}
    })
  }

  getAllSideFilterAccess() {
    this.apiService.getAllSideFilterAccess().subscribe((res:any) => {
      if(!res?.error && res?.results.length>0) {
        const allSideAccess = res?.results;

        this.allCountryList.map((item, index) => {
          if(item.hasOwnProperty("Import")) {
            item["filters"] = allSideAccess.filter(item2 => item2["Direction"]=="IMPORT" && item2["Country"]==item["Countrycode"])[0] || this.setDefaultFilter(item["Countrycode"], "IMPORT");
          } else {
            item["filters"] = allSideAccess.filter(item2 => item2["Direction"]=="EXPORT" && item2["Country"]==item["Countrycode"])[0] || this.setDefaultFilter(item["Countrycode"], "EXPORT");
          }

          if(index == this.allCountryList.length-1) setTimeout(() => this.isLoading = false, 1000);
        });
      }
    });
  }

  getCountryList() {
    this.allCountryList = [];
    const countryAPIkey = `${environment.apiurl}/api/getContries`;
    if((environment.apiDataCache).hasOwnProperty(countryAPIkey)) {
      this.countryFurtherProcess(JSON.parse(JSON.stringify(environment.apiDataCache[countryAPIkey])));
    } else {
      this.userService.getCountrylist().subscribe(res =>{
        if(!res?.error && res?.code == 200) {
           this.countryFurtherProcess(res.results);
           environment.apiDataCache[countryAPIkey] = JSON.parse(JSON.stringify(res.results));
        }
      });
    }
  }
  countryFurtherProcess(result:any[]) {
    for(let k=0; k<result.length; k++) {
      const isItemAlreadyAvailable = this.countryList.filter(item => item?.Countrycode == result[k]["Countrycode"]).length > 0;
      if(!isItemAlreadyAvailable) {
        this.countryList.push(result[k]);
      }
    }

    for(let i=0; i<this.countryList.length; i++) {
      if(this.countryList[i]["Export"]) this.setAllCountryArr(this.countryList, i, "Import");

      if(this.countryList[i]["Import"])  this.setAllCountryArr(this.countryList, i, "Export");
    }

    this.getAllSideFilterAccess();
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
    const {countryName, direction, latestDate} = this.countryDateObj;
    if([countryName, direction, latestDate].includes("")) {
      this.errorMsg = "Please fill all the required fields";
      
      if(this.errorTimeout) clearTimeout(this.errorTimeout);
      this.errorTimeout = setTimeout(() => this.errorMsg = "", 2000);
      
      return;
    }
    
    this.updateBtn = "UPDATING..."
    
    this.apiService.updateCountryDate(this.countryDateObj).subscribe((res:any) => {
      if(!res.error) {
        const modalRef2 = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'downloadModalClass' });
        (<DownloadModelComponent>modalRef2.componentInstance).modalType = "updateDate-msg";
        (<DownloadModelComponent>modalRef2.componentInstance).customMsg = `${this.countryDateObj.countryName}-${this.countryDateObj.direction} latest date has been updated successfully!`;

        this.updateBtn = "UPDATE";
        this.countryDateObj = {
          countryName: "", 
          direction: "", 
          latestDate: ""
        };
      }
    });
  }

  setClassName(index, arr:string[]):string {
    if(index == 0) return "left-sticky1";
    else if(index == 1) return "left-sticky2";
    else if(index == arr.length-2) return "right-sticky2";
    else if(index == arr.length-1) return "right-sticky1";
    else return "";
  }

  updateSideFilterAccess(e, key, data) {
    const flagBool = e.target.checked;
    data.filters[key] = flagBool;    

    this.apiService.addUpdateSideFilterAccess(data?.filters).subscribe((res:any) => {
      if(!res.error) {
        this.alertService.success(`${data?.CountryName} sidefilter Updated!`);
      } else {
        this.alertService.error(res.message);
      }
    });
  }

  getFormModal() {
    const modalRef = this.modalService.open(EditModalComponent, { backdrop: "static", keyboard: false, windowClass: 'addUpdateCountry' });
    (<EditModalComponent>modalRef.componentInstance).isUpdateMode = false;
    const modalRef2 = (<EditModalComponent>modalRef.componentInstance).callback.subscribe(res => {
      this.isLoading = true;
      this.getCountryList(); 
      modalRef2.unsubscribe();
    });
  }

  getFormUpdateModal(Countrycode) {
    const data = this.countryList.filter(item => item["Countrycode"] == Countrycode)[0];
    
    const modalRef = this.modalService.open(EditModalComponent, { backdrop: "static", keyboard: false, windowClass: 'addUpdateCountry' });
    (<EditModalComponent>modalRef.componentInstance).isUpdateMode = true;
    (<EditModalComponent>modalRef.componentInstance).currentCountryObj = data;
    const modalRef2 = (<EditModalComponent>modalRef.componentInstance).callback.subscribe(res => {
      this.isLoading = true;
      this.getCountryList(); 
      modalRef2.unsubscribe();
    });
  }

  showSideFilterDetail(data, type) {
    const modalRef = this.modalService.open(EditModalComponent, { backdrop: "static", keyboard: false, windowClass: 'addUpdateCountry' });
    (<EditModalComponent>modalRef.componentInstance).sideFilterData = data;
    (<EditModalComponent>modalRef.componentInstance).isCountryForm = false;
  }


}
