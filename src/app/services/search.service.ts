import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {environment} from 'src/environments/environment';
import { AuthService } from './auth.service';
import {Subject, Subscription} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  apiUrl:string = environment.apiurl;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }


  getSideFilterAccess(country:string, direction:string) {
    return this.http.get(`${this.apiUrl}api/getSideFilterAccess?Country=${country}&Direction=${direction}`);
  }


  //get searched data API
  getSearchedDataWithFilter(apiData:any) {
    const {country, direction, body} = apiData;
    const directionType = direction=="export" ? "Exports" : "Imports";

    return this.http.post(`${this.apiUrl}api/get${country}${directionType}`, body);
  }

  //get all filter data as per country and direction
  getFilterDataAPI(body:any, country:any) {
    body["CountryCode"] = country?.code;
    body["CountryName"] = country?.country; 
    body["Direction"] = country?.direction;

    return this.http.post(`${this.apiUrl}api/getSideFilterData`, body);
  }

  //get searched record tabs counting
  getSearchedRecordCounting(body:any) {
    return this.http.post(`${this.apiUrl}api/getcount`, body);
  }


  //get sidefilters data segment wise
  getSideFilterSegments(body, country) {
    try {
      body["CountryCode"] = country?.code;
      body["CountryName"] = country?.country; 
      body["Direction"] = country?.direction;
    } catch (error) {}

    return [
      this.http.post(`${this.apiUrl}api/getfirstSideFilterData`, body),
      this.http.post(`${this.apiUrl}api/getsecondSideFilterData`, body),
      this.http.post(`${this.apiUrl}api/getthirdSideFilterData`, body),
      this.http.post(`${this.apiUrl}api/getfourthSideFilterData`, body), 
      this.http.post(`${this.apiUrl}api/getfifthSideFilterData`, body), 
      this.http.post(`${this.apiUrl}api/getexportSideFilterData`, body),
      this.http.post(`${this.apiUrl}api/getimportSideFilterData`, body)
    ];
  }
  
}

// tempUrlArr.forEach((url, index) => {
//   this.sideApiSubscription[subscription[index]] = url.subscribe((res:any) => {
//     sideFilterData = {...sideFilterData, ...res?.results};

//     if(index == tempUrlArr.length-1) {
//       resolve(sideFilterData);
//       return;
//     }
//   }, err => {
//     if(index == tempUrlArr.length-1) {
//       resolve(sideFilterData);
//       return;
//     }
//   })
//   }
// );
