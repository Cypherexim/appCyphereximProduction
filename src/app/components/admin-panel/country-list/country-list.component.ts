import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { ApiMsgRes } from 'src/app/models/api.types';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.css']
})
export class CountryListComponent implements OnInit {

  constructor(
    private apiService:ApiServiceService,
    public activeModal: NgbActiveModal, 
    private authService: AuthService,
    private eventService: EventemittersService
  ) {}
  
  apiRunCounter:number = 0;
  userDetails:any;
  totalCount = {all: 0, Detailed:0, Mirror: 0, Statics: 0};
  combinedResponse:ApiMsgRes[] = [];
  lastTabTagId:string = "globeTab1";
  copiedCountryList:any[] = [];
  availableCoutriesTypes = {
    "globeTab1": [],
    "globeTab2": [],
    "globeTab3": []
  };
  isApiInProcess:boolean = false;
  countryHeads:string[] = ['countries', 'availability', 'direction', 'data fields', 'sample'];//, 'data coverage'
  modalHeadWidth = {
    'countries': '20%', 
    'direction': '8%',
    'data coverage': '10%', 
    'data availability': '15%', 
    'sample': '7%'
  };

  tabs:any[] = [
    {tabName: "Detailed", key: "globeTab1", dbType: "CUSTOM"},
    {tabName: "Mirror", key: "globeTab2", dbType: "MIRROR"},
    {tabName: "Statics", key: "globeTab3", dbType: "STATISTICAL"},
  ];

  ngOnInit(): void {
    this.userDetails = this.authService.getUserDetails();
    this.cachingGlobalCountriesAPI();
  }

  cachingGlobalCountriesAPI() {
    this.isApiInProcess = true;
    const apiKey = `${environment.apiurl}api/getGlobalCountriesList?type=all`;

    if(environment.apiDataCache.hasOwnProperty(apiKey)) {
      const res = environment.apiDataCache[apiKey];
      this.getGlobalCoutriesByType(res);
    } else {
      forkJoin([
        this.apiService.getGlobalCountriesList("CUSTOM"),
        this.apiService.getGlobalCountriesList("MIRROR"),
        this.apiService.getGlobalCountriesList("STATISTICAL")
      ]).subscribe({
        next: (res:any) => {
          this.getGlobalCoutriesByType(res);
          environment.apiDataCache[apiKey] = res;
        }, error: (err:any) => console.log(err)
      });
    }
  }

  getGlobalCoutriesByType(res:any) {
    this.availableCoutriesTypes.globeTab1 = res[0].results;     
    this.availableCoutriesTypes.globeTab2 = res[1].results;     
    this.availableCoutriesTypes.globeTab3 = res[2].results;
    this.totalCount = {
      Detailed: res[0].results.length,
      Mirror: res[1].results.length,
      Statics: res[2].results.length,
      all: res[0].results.length + res[1].results.length + res[2].results.length
    }
    
    this.copiedCountryList = JSON.parse(JSON.stringify(this.availableCoutriesTypes[this.lastTabTagId]));
    this.isApiInProcess = false;
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
    this.isApiInProcess = true;
    if(id == this.lastTabTagId) {
      this.isApiInProcess = false;
      return;
    }
    
    if(this.lastTabTagId == "") {this.lastTabTagId = id;} 
    else {this.lastTabTagId = id;}
    
    this.copiedCountryList = JSON.parse(JSON.stringify(this.availableCoutriesTypes[id]));
    setTimeout(() => this.isApiInProcess = false, 1000);
  }


  //to set the current country and send to the homepage this value
  onSelectCountry(item:any) {
    const objData = {
      country: item?.CountryName, 
      direction: item?.Direction,
      code: item?.Countrycode, 
      type: item?.data_type
    };
    this.eventService.currentCountry.next(objData);
    this.eventService.refreshPageNameEvent.next("country");
    this.eventService.headerClickEvent.emit('home');
    this.activeModal.dismiss('Cross click');
  }

  onSearch(e:any) {//{Coutrycode: 'IND', CountryName: 'India'}
    const currentVal = (e.target.value).toLowerCase();
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
}

