import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription, timer } from 'rxjs';
import { ApiMsgRes } from 'src/app/models/api.types';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-commodity-table',
  templateUrl: './commodity-table.component.html',
  styleUrls: ['./commodity-table.component.css']
})
export class CommodityTableComponent implements OnInit, OnDestroy {
  month:string = "";
  year:number = 2023;
  isAPIinProcess:boolean = false;
  direction:string = "Import";
  financialYearMonths:string[] = ["APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","JAN","FEB","MAR"];
  monthsArr:string[] = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  tableHeads:string[] = ['', 'commodity', 'chart', `fy(${Number(this.year)-1}-${this.year})`, `fy(${this.year}-${Number(this.year)+1})`, `${this.month}-${this.year}`, `${this.month}-${Number(this.year)+1}`, 'Mkt Share(%)', 'total value'];
  
  arrangedData = {};
  financialYearValues=[];
  commodities:string[] = [];

  apiSubscription:Subscription = new Subscription();
  eventSubscription:Subscription = new Subscription();
  timerSubscription:Subscription = new Subscription();

  constructor(
    private apiService: ApiServiceService,
    private eventService: EventemittersService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.getCommidityData();
    this.whatstrandingEventInit();
  }

  ngOnDestroy(): void {
    this.apiSubscription?.unsubscribe();
    this.eventSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  whatstrandingEventInit() {
    this.eventSubscription = this.eventService.onChangeDirectionBullet.subscribe({
      next: (res:any) => {
        const {type, value} = res;
        if(type==="direction") {this.direction = value;}
        else {this.year = value;}

        this.getCommidityData();
      }, error: (err:any) => console.log(err)
    });
  }

  getCommidityData() {
    this.isAPIinProcess = true;
    this.commodities = [];
    this.arrangedData = {};
    const body = { direction: this.direction, year: this.year };
    const apiCacheKey = `${environment.apiurl}api/getWhatstrendingCommodity?year=${this.year}&direction=${this.direction}`;

    if(environment.apiDataCache.hasOwnProperty(apiCacheKey)) {
      const tempRes = JSON.parse(JSON.stringify(environment.apiDataCache[apiCacheKey]));
      this.timerSubscription = timer(1500).subscribe(() => this.transformResponseData(tempRes));
    } else {
      this.apiSubscription = this.apiService.getWhatstrandingCommodityData(body).subscribe({
        next: (res:ApiMsgRes) => {
          if(!res.error) {
            this.transformResponseData(res.results);
            environment.apiDataCache[apiCacheKey] = res.results;
          }
        }, error: (err:ApiMsgRes) => {console.log(err.msg)}
      });
    }
  }


  transformResponseData(result:any) {
    const tempArr = result;
    const loopLen = tempArr.length;
    
    for(let i=0; i<loopLen; i++) {
      if(this.arrangedData.hasOwnProperty(tempArr[i]["commodity_name"]) && 
        this.arrangedData[tempArr[i]["commodity_name"]].hasOwnProperty(tempArr[i]["Year"]) &&
        this.arrangedData[tempArr[i]["commodity_name"]][tempArr[i]["Year"]].hasOwnProperty(tempArr[i]["Month"])
      ) {
        this.arrangedData[tempArr[i]["commodity_name"]][tempArr[i]["Year"]][tempArr[i]["Month"]] += Number(tempArr[i]["total_value"])
      } else {
        if(!this.arrangedData.hasOwnProperty(tempArr[i]["commodity_name"])) this.arrangedData[tempArr[i]["commodity_name"]] = {};
        if(!this.arrangedData[tempArr[i]["commodity_name"]].hasOwnProperty(tempArr[i]["Year"])) this.arrangedData[tempArr[i]["commodity_name"]][tempArr[i]["Year"]] = {};

        this.arrangedData = {
          ...this.arrangedData,
          [tempArr[i]["commodity_name"]]: {
            ...this.arrangedData[tempArr[i]["commodity_name"]],
            [tempArr[i]["Year"]]: {
              ...this.arrangedData[tempArr[i]["commodity_name"]][tempArr[i]["Year"]],
              [tempArr[i]["Month"]]: Number(tempArr[i]["total_value"])
            }
          }
        };          
      }
    }
    
    this.commodities = Object.keys(this.arrangedData);
    const tempYears:any = Object.keys(this.arrangedData[this.commodities[0]]);
    const arrangedLatestYearMonths = Object.keys(this.arrangedData[this.commodities[0]][Math.max(...tempYears)])
                      .sort((a:string,b:string) => this.monthsArr.indexOf(a) - this.monthsArr.indexOf(b));
    this.month = arrangedLatestYearMonths[arrangedLatestYearMonths.length-1];
    this.tableHeads = ['', 'commodity', 'chart', `fy(${Number(this.year)-1}-${this.year})`, `fy(${this.year}-${Number(this.year)+1})`, `${this.month}-${this.year}`, `${this.month}-${Number(this.year)+1}`, 'Mkt Share(%)', 'total value'];          
    console.log(this.arrangedData)
    this.isAPIinProcess = false;
  }
}
