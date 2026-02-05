import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Utility } from 'src/app/models/others';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { Subscription, timer } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import * as Highcharts from "highcharts/highmaps";
import * as worldMap from "@highcharts/map-collection/custom/world-highres.geo.json";
import { ApiMsgRes } from 'src/app/models/api.types';


@Component({
  selector: 'app-whats-trending',
  templateUrl: './whats-trending.component.html',
  styleUrls: ['./whats-trending.component.css']
})
export class WhatsTrendingComponent implements OnInit, OnDestroy {
  @Input() currentPage:string = "";

  exportValue:string = "";
  importValue:string = "";
  totalValue:string = "";
  directionType:string = "import";

  isAPIinProcess:boolean = false;

  containerHeight:any = [];
  worldMapList:any[] = [];
  mapHighcharts:any;
  countryData:[string, number][] = [];

  isAnalysisTabActive:boolean = false;
  // apiSubscription:Subscription = new Subscription();
  // apiSubscription2:Subscription = new Subscription();
  eventSubscription:Subscription = new Subscription();
  eventSubscription2:Subscription = new Subscription();
  eventSubscription3:Subscription = new Subscription();
  timerSubscription:Subscription = new Subscription();
  allCountries:Utility = new Utility();
  
  tableHeads:string[] = ['Country','Export Companies','Import Companies','Export(%)','Import(%)'];
  smChartOptions = [
    {
      id: 1,
      data: [15, 5, 20, 10, 30, 13, 5, 28],
      borderColor: '#48b1f0',
      backColor: '#cbeefc'
    },
    {
      id: 2,
      data: [15, 5, 20, 10, 30, 13, 5, 28],
      borderColor: '#f8bf45',
      backColor: '#fef3d6'
    },
    {
      id: 3,
      data: [15, 5, 20, 10, 30, 13, 5, 28],
      borderColor: '#56b353',
      backColor: '#cceeda'
    }
  ];
  mdChartOptions = [
    {
      id: 1,
      legend: false,
      labels: [],
      data: [],
      borderColor: 'rgb(255, 99, 132)',
      backColor: 'rgba(255, 99, 132, 0.2)'
    },
    {
      id: 2,
      legend: true,
      labels: [],
      data: [],
      borderColor: ["#50af48", "#40acf0", "#f8bf45", "#f44336d1","#e81e63d1","#9c27b0d1","#673ab7d1","#3f51b5d1","#2196f3d1","#03a9f4d1"],
      backColor: ["#50af48", "#40acf0", "#f8bf45", "#f44336d1","#e81e63d1","#9c27b0d1","#673ab7d1","#3f51b5d1","#2196f3d1","#03a9f4d1"]
    },
    {
      id: 3,
      legend: true,
      labels: [],
      data: [
        { label: '', backgroundColor: "#50af48", data: [] }, 
        { label: '', backgroundColor: "#40acf0", data: [] }, 
        { label: '', backgroundColor: "#f8bf45", data: [] }
      ]
    },
    {
      id: 4,
      legend: false,
      labels: [],
      data: [],
      borderColor: '#f9c750'
    }
  ];
  currentRating:number = 1.5;
  ratingArr = [];


  constructor(
    private alertServcie: AlertifyService,
    private apiService: ApiServiceService,
    private eventService: EventemittersService
  ) { }

  ngOnInit(): void {
    if(this.currentPage==="trending") this.onWhatsTrandingInit();
  }

  ngOnDestroy(): void {
    this.eventSubscription?.unsubscribe();
    this.eventSubscription2?.unsubscribe();
    this.eventSubscription3?.unsubscribe();
    // this.apiSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  onWhatsTrandingInit():void {
    this.getWorldMapData();
    this.getChartDirection();

    if(`${this.currentRating}`.includes('.')) {
      for(let i=1; i<=5; i++) {
        if(i < this.currentRating) this.ratingArr.push('full');
        else if(i > this.currentRating && i-1 < this.currentRating) this.ratingArr.push('half');
        else this.ratingArr.push('no');
      }
    } else {
      for(let i=0; i<5; i++) {
        if(i+1 <= this.currentRating) this.ratingArr.push('full');
        else this.ratingArr.push('no');
      }
    }

    //on changing of tab from table to analysis or vice-versa
    this.eventSubscription = this.eventService.dataTabChngEvent.subscribe(res => {
      this.isAnalysisTabActive = res;
    });

    //get container height as per resolution
    this.getCurrentHeight();

    this.whatsTrendingDataInit();
    this.getTotalShipmentValue(2022);
  }

  getChartDirection() {
    this.eventSubscription3 = this.eventService.onChangeDirectionBullet.subscribe({
      next: (res:any) => {
        const {type, value} = res;
        if(type==="direction") {
          this.directionType = value;
          this.getWorldMapRefinedData();
        }
      }, error: (err:any) => console.log(err)
    });
  }

  getWorldMapData() {
    this.isAPIinProcess = true; 
    // this.apiSubscription = 
    this.apiService.getWhatsTrandingMap().subscribe({
      next: (res:ApiMsgRes) => {
        if(!res.error) {
          this.worldMapList = JSON.parse(JSON.stringify(res.results));
          this.getWorldMapRefinedData();
        }
      }, error: (err:any) => console.log(err)
    });
  }
  getWorldMapRefinedData() {
    const dataArr = JSON.parse(JSON.stringify(this.worldMapList));
    const numInK = (val:number):string => Number(val/1000).toFixed(2);
    const tempObjLen = dataArr.length;
    const allCountryCode = new Utility().countries;
    this.countryData = [];

    for(let j=0; j<tempObjLen; j++) {
      const codeItem = allCountryCode.filter(item => item["name"].toLowerCase() == dataArr[j]["country"].toLowerCase());
      if(codeItem.length>0) {
        const countryValue = numInK(dataArr[j][`total_${this.directionType}ers`]);
        this.countryData.push([codeItem[0]["code"].toLowerCase(), Number(countryValue)]);
      }
    }
    
    if(this.mapHighcharts) this.mapHighcharts.destroy();

    this.isAPIinProcess = false;
    this.timerSubscription = timer(1000).subscribe(() => this.worldMapInit());
  }

  getCurrentHeight() {
    this.containerHeight = this.alertServcie.setAsPerRes("whatstrending");
  }

  whatsTrendingDataInit() {
    this.eventSubscription2 = this.eventService.whatsTrendingEvent.subscribe({
      next: (year:number) => {
        this.getTotalShipmentValue(year);
      }, error: (err:any) => {console.log(err);}
    });
  }

  getTotalShipmentValue(year:number) {
    this.apiService.getWhatstrandingTotalVal(year).subscribe({
      next: (res:any) => {
        if(!res.error) {
          const {total_import, total_export, total_value} = res?.results[0];
          const totalCount = Number(total_value);
          this.exportValue = ((Number(total_export) * 100) / totalCount).toFixed(2) + "%";
          this.importValue = ((Number(total_import) * 100) / totalCount).toFixed(2) + "%";
          this.totalValue = Number(totalCount / 1000000000).toFixed(2) + " Bn $";
        }
      }, error: (err:any) => {console.log(err);}
    });
  }

  worldMapInit() {
    const labelName = this.directionType=="export"? "Exporters": "Importers";

    this.mapHighcharts = Highcharts.mapChart('whatsTrandingWorldMap', {
      accessibility: {enabled: false},
      chart: {
        map: worldMap,
        animation: true,
        events: {
          load: function () {
            const chart = this;

            // Function to set chart size based on container size
            function resizeChart() {
                chart.setSize(null, null);
            }

            // Attach the resize function to window resize event
            window.addEventListener('resize', resizeChart);
          }
        }
      },
      credits: {enabled: false},
      subtitle: {
        text: `There are total ${labelName} companies in various countries around the world.`,
        align: "left",
        verticalAlign: "top",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          fontFamily: "system-ui"
        }
      },
      title: {
        text: `Total Number of ${labelName} Companies`,
        align: "left",
        verticalAlign: "top",
        style: {
          color: 'black',
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Roboto, sans-serif',
          textTransform: 'uppercase'
        }
      },
      colors: ['#e5e5e5'],
      mapNavigation: {
        enabled: true,
        buttonOptions: { alignTo: "plotBox" }
      },
      plotOptions: {map: {borderColor: "white", borderWidth: 1.3}, series: {dataLabels: {enabled: true}}},
      legend: {enabled: false},
      colorAxis: {dataClasses: []},
      tooltip: {
        enabled: true,
        useHTML: true,
        borderColor: '#aaa',
        backgroundColor: "white",
        headerFormat: '<div style="width:100%;margin-bottom:10px;text-align:center;color:black;"><b>{point.point.name}</b></div>',
        pointFormat: `<b>${labelName}:</b>&nbsp;{point.value}K`,//<br><b>Other: </b>{point.total}
      },
      series: [
        {
          type: "map",
          showInLegend: false,
          states: {
            hover: {color: "#82d2c0",borderColor: "#606060"}
          },
          dataLabels: {
            enabled: true,
            formatter: function() { return this.point.value ? this.point.name : null; }
          },
          allAreas: true,          
          data: this.countryData,
          color: "#4cbfa6",
          nullColor: "#007bff96"
        }]
    });
  }
}



