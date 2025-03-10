import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { ApiMsgRes } from 'src/app/models/api.types';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.css']
})
export class CountryListComponent implements OnInit {

  constructor(
    private alertService: AlertifyService,
    private apiService:ApiServiceService,
    public activeModal: NgbActiveModal, 
    private authService: AuthService,
    private eventService: EventemittersService
  ) {}
  
  apiRunCounter:number = 0;
  userDetails:any;
  totalCount = {all: 0, Detailed:0, Mirror: 0, Statics: 0};
  countryList: any[] = [];
  combinedResponse:ApiMsgRes[] = [];
  lastTabTagId:string = "globeTab1";
  copiedCountryList:any[] = [];
  availableCoutriesTypes = {
    "globeTab1": [],
    "globeTab2": [],
    "globeTab3": []
  };
  isApiInProcess:boolean = false;
  countryHeads:string[] = ['countries', 'availability', 'direction', 'data coverage', 'data fields', 'sample'];
  modalHeadWidth = {
    'countries': '20%', 
    'direction': '8%',
    'data coverage': '10%', 
    'data availability': '15%', 
    'sample': '7%'
  };

  tabs:any[] = [
    {tabName: "Detailed", key: "globeTab1"},
    {tabName: "Mirror", key: "globeTab2"},
    {tabName: "Statics", key: "globeTab3"},
    // {tabName: "", key: "globeTab4"}
  ];

  ngOnInit(): void {
    this.userDetails = this.authService.getUserDetails();
  }

  isAvailbale(country:string):boolean {
    if(this.userDetails["CountryAccess"] == "All") {
      return true;
    } else {
      const countriesArr:string[] = (this.userDetails["CountryAccess"]).split(",");
      if(countriesArr.includes(country)) return true;
      else return false;
    }
  }

  onClickTab(id:string) {
    if(id == this.lastTabTagId) return;
    
    if(this.lastTabTagId == "") {this.lastTabTagId = id;} 
    else {this.lastTabTagId = id;}
    
    this.getCountryList(this.countryList, id);
  }

  getCountryListInit(result:any[]) {
    this.countryList = JSON.parse(JSON.stringify(result));
    this.getCountryList(this.countryList, "globeTab1");
  }

  setTotalCount(result:any[]) {
    this.totalCount = {Detailed: 0, Mirror: 0, Statics: 0, all: 0};
    this.totalCount.all = result.length;

    for(let i=0; i<this.totalCount.all; i++) {
      if(['CUSTOM', 'BILL OF LADINGS','TRANSHIPMENT'].includes(result[i]["data_type"])) { this.totalCount.Detailed += 1; }

      if(result[i]["data_type"] == "MIRROR") this.totalCount.Mirror += 1;
        
      if(result[i]["data_type"] == "STATISTICAL") this.totalCount.Statics += 1;
    }
  }

  //hitting api to get all country
  getCountryList(result:any[], tabKey:string="globeTab1") {
    this.isApiInProcess = true;
    const {Detailed, Mirror, Statics} = this.totalCount;
    // this.copiedCountryList = [];

    if(result.length == 0) this.getCountryListApi(tabKey);
    else {
      if(tabKey=="globeTab1") {
        this.availableCoutriesTypes[tabKey] = result.filter(item => ['CUSTOM', 'BILL OF LADINGS','TRANSHIPMENT'].includes(item?.data_type));
        if([Detailed, Mirror, Statics].includes(0)) this.setTotalCount(result);
      } else if(tabKey=="globeTab2") {
        this.availableCoutriesTypes[tabKey] = result.filter(item => item?.data_type == "MIRROR");
      } else if(tabKey=="globeTab3") {
        this.availableCoutriesTypes[tabKey] = result.filter(item => item?.data_type == "STATISTICAL");
      }

      this.copiedCountryList = JSON.parse(JSON.stringify(this.availableCoutriesTypes[tabKey]));
      this.isApiInProcess = false;
    }
  }

  //to set the current country and send to the homepage this value
  onSelectCountry(item:any, direction:string) {
    const objData = {country: item?.CountryName, direction, code: item?.Countrycode};
    this.eventService.currentCountry.next(objData);
    this.eventService.refreshPageNameEvent.next("country");
    this.eventService.headerClickEvent.emit('home');
    this.activeModal.dismiss('Cross click');
  }

  onSearch(e:any) {//{Coutrycode: 'IND', CountryName: 'India'}
    const currentVal = (e.target.value).toLowerCase();
    // const tempArr = this.countryList.filter(obj => ((obj?.CountryName).toLowerCase()).includes(currentVal));
    const tempArr = this.availableCoutriesTypes[this.lastTabTagId].filter((obj:any) => ((obj?.CountryName).toLowerCase()).includes(currentVal));
    this.copiedCountryList = JSON.parse(JSON.stringify(tempArr));
  }

  onHover(e:any, bool:boolean) {
    if(bool) {
      e.target.classList.remove('gray-bgColor');
      e.target.classList.add('blue-bgColor');
    } else {
      e.target.classList.remove('blue-bgColor');
      e.target.classList.add('gray-bgColor');
    }
  }

  isIndiaCountry(item:any):boolean {
    return (item?.CountryName==this.userDetails?.CountryCode && this.userDetails?.CountryCode=='India');
  }

  getCountryListApi(tabKey:string) {
    if(this.apiRunCounter>0) return;

    this.apiRunCounter++;

    const countryAPIkey = `${environment.apiurl}api/getAllGlobeCountries`;

    if((environment.apiDataCache).hasOwnProperty(countryAPIkey)) {
      this.countryList = environment.apiDataCache[countryAPIkey];
      this.getCountryList(JSON.parse(JSON.stringify(this.countryList)));
    } else {
      forkJoin([
        this.apiService.getAllGlobeCountries(),
        this.apiService.getAllCountriesDates()
      ]).subscribe({
        next: async(res:ApiMsgRes[]) => {
          this.combinedResponse = res;
          this.countryList = await this.alertService.refineGlobalCountryList(this.combinedResponse);
          environment.apiDataCache[countryAPIkey] = JSON.parse(JSON.stringify(this.countryList));
          environment.apiDataCache[countryAPIkey] = this.countryList;
          this.getCountryList(this.countryList, tabKey);
        }, error: (err:any) => console.log(err)
      });


      
      // this.apiService.getAllGlobeCountries().subscribe({
      //   next: (res:ApiMsgRes) => {
      //     if(!res.error) {
      //       this.getCountryList(res?.results);
      //       environment.apiDataCache[countryAPIkey] = res?.results;
      //     }
      //   }, error: (err:ApiMsgRes) => console.log(err.message)
      // })


      // this.userService.getCountrylist().subscribe({
      //   next: (res:any) => {
      //     if(!res?.error) {
      //       this.getCountryList(res?.results);
      //       environment.apiurl[countryAPIkey] = res?.results;
      //     }
      //   }
      // });
    }
  }
}

