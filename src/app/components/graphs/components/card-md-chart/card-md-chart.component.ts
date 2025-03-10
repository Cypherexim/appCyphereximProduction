import { Component, OnInit, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Chart,ChartType, ChartData } from 'chart.js';
import { Subscription } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-card-md-chart',
  templateUrl: './card-md-chart.component.html',
  styleUrls: ['./card-md-chart.component.css']
})
export class CardMdChartComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() chartOption:any = {};
  @Input() type:ChartType;

  directionType:string = "Import";
  chartObj:Chart;
  isLeftSide:boolean = true;
  intervalVar:any;
  isMultiSelectOn:boolean = false;
  isAPIinProcess:boolean = false;

  apiSubscription1:Subscription = new Subscription();
  apiSubscription2:Subscription = new Subscription();

  
  getTitle = (type:string, key:string) => {
    const chartTitles = {
      pie: {
        mainHead: `Top ${this.topCountriesNum} Countries by ${this.directionType}`,
        subHead: `Top ${this.directionType}ing countries displayed by value`,
      },
      radar: {
        mainHead: `Monthlwise Graph by Percentage in ${this.directionType}`,
        subHead: `Months and graphical representation of high percentage in ${this.directionType}`,
      },
      line: {
        mainHead: `Monthwise running graph of high-low value in ${this.directionType}`,
        subHead: `Months and graphical representation of high-low value in ${this.directionType}`,
      },
      bar: {
        mainHead: `Top 5 ${this.directionType}ing Companies with their Top Products`,
        subHead: "",
      }
    };
    
    return chartTitles[type][key];
  }

  //chart variables
  topCompanies = {countries: [], values: []};
  radarDataValues = {months: [], percentages: []};//temp
  lineDataValues = {months: [], percentages: [], values: []};//temp
  lineRadarDataValues = {months: [], percentages: [], values: []};
  barDataValues = {companies: [], values: []};
  barGraphValues = {companies: [], data: []};
  currentLineValue:any = 0;
  currentLinePercentage:any = 0;
  topCountriesNum:number = 3;
  convertor:Function = this.alertService.valueInBillion;
  whatsTrandingYear:number = 2022;

  constructor(
    private apiService: ApiServiceService,
    private alertService: AlertifyService,
    private eventService: EventemittersService,
  ) { }

  ngOnInit(): void {
    this.isLeftSide = this.type=='line'||this.type=='radar'?true:false;
    this.startGettingChartDirection();
    // this.lineGraphEvent();
  }

  ngAfterViewInit(): void {
    if(this.type) {      
      this.setGraphDetails(this.chartOption.id);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalVar);
    // this.apiSubscription1.unsubscribe();
    // this.apiSubscription2.unsubscribe();
  }

  resetCurrentGraphs() {
    if(this.type=="radar") {this.radarDataValues = {months: [], percentages: []};}
    else {this.lineDataValues = {months: [], percentages: [], values: []};}
  }

  startGettingChartDirection() {
    this.eventService.onChangeDirectionBullet.subscribe({
      next: (res:any) => {
        const {type, value} = res;
        if(type=="direction") this.directionType = value;
        else this.whatsTrandingYear = value;

        this.chartObj.destroy();
        if(this.type) { this.setGraphDetails(this.chartOption.id); }
      }, error: (err:any) => console.log(err)
    });
  }

  setGraphDetails(id:any) {
    const lineCanvasEle: any = document.getElementById('chart_'+id);
    // let dataSet:ChartData;

    if(this.type != 'bar') {
      if(this.type=="pie") {this.getEachAnalysisGraphData("country");}
      else if(["line","radar"].includes(this.type)) {this.getEachAnalysisGraphData("month");}

      this.chartObj = new Chart(lineCanvasEle.getContext('2d'), {
        type: this.type,
        data: {
          labels: this.chartOption.labels,
          datasets: [{
            tension: 0,
            data: this.chartOption.data,
            fill: this.type != 'line',
            backgroundColor: this.chartOption.backColor,
            borderColor: this.chartOption.borderColor,
            pointBackgroundColor: this.chartOption.borderColor,
            pointBorderColor: this.chartOption.borderColor,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: this.chartOption.borderColor,
            hoverOffset: 4
          }]
        },        
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {x: {
            grid: {display: false}, 
            ticks: {display: this.type == 'line'},
            border: {display: this.type == 'line'}
          }},
          plugins: {
            legend: {
              title: {display: true},
              display: this.chartOption.legend,
              position: 'bottom',
            },
          },
          // animation: {
          //   onComplete: (chartObj:any) => this.alertService.pieLabelsLine(chartObj, this.type)
          // }
        },
      });
    } else {
      this.getEachAnalysisGraphData("company");
      this.chartObj = new Chart(lineCanvasEle.getContext('2d'), {
        type: this.type,        
        data: {
          labels: this.chartOption.labels,
          datasets:  this.chartOption.data
        },
        options: {
          scales: {
            y: {stacked: true},
            x: {stacked: true, grid: {display: false}, ticks: {              
              callback: (value:any) => {
                const labelName = this.barGraphValues.companies[value];                
                return labelName.substring(0, 10)+"...";
              }
            }}               
          },
          plugins: {legend: {display: this.chartOption.legend}},
          // maintainAspectRatio: false
        }
      });
    }
  }

  chartUpdate() {
    this.lineRadarDataValues.percentages.push(this.lineRadarDataValues.percentages.shift());
    this.chartObj.data.labels.push(this.chartObj.data.labels.shift());
    this.chartObj.data.datasets[0].data.push(this.chartObj.data.datasets[0].data.shift());
    this.currentLinePercentage = (this.lineRadarDataValues.percentages[0]);
    this.currentLineValue = Number(this.chartObj.data.datasets[0].data[0]).toFixed(2);
    this.chartObj.update();
  }

  setGraphInterval(interval:any) {
    if(this.type == "pie") {
      const tempArrObj = {countries:[], values:[]};
      this.topCountriesNum = interval;
      for(let i=0; i<interval; i++) {
        tempArrObj.countries.push(this.topCompanies.countries[i]);
        tempArrObj.values.push(this.topCompanies.values[i]);
      }
      this.updateChart(tempArrObj.countries, tempArrObj.values);
    } else if(["radar", "line"].includes(this.type)) {
      const tempArrObj = {months: [], percentages: [], values: []};
      this.currentLineValue = this.lineRadarDataValues.values[0].toFixed(2);
      for(let i=0; i<interval; i++) {
        tempArrObj.months.push(this.lineRadarDataValues.months[i]);
        tempArrObj.values.push(this.lineRadarDataValues.values[i]);
        tempArrObj.percentages.push(this.lineRadarDataValues.percentages[i]);
      }
      this.updateChart(tempArrObj.months, tempArrObj[this.type=="radar" ? "percentages": "values"]);
    }
    this.isMultiSelectOn = false;
  }
  
  
  updateChart(labels:any[], data:any[]) {
    this.chartObj.data.labels = labels;
    this.chartObj.data.datasets[0].data = data;

    if(["line","pie"].includes(this.type)) {
      this.chartObj.options.plugins.tooltip.callbacks.label = this.type=="pie" ? this.pieCallBackTooltip : (context) => `${context.formattedValue} Bn $`;
      
      if(this.type == "line") {
        if(this.intervalVar) {clearInterval(this.intervalVar);}
        this.intervalVar = setInterval(() => this.chartUpdate(), 3000); 
      }
    } else if(this.type=="radar") {
      this.chartObj.options.plugins.tooltip.callbacks.label = (context) => `${context.formattedValue}%`;
    }
    this.chartObj.update();
  }


  updateBarChart() {
    this.chartObj.data.labels = this.barGraphValues.companies;
    this.chartObj.data.datasets = this.barGraphValues.data;
    this.chartObj.options.plugins.tooltip.callbacks.label = (context) => {      
      return `${context.formattedValue} Bn $ \n (${context.dataset["hscode"][context.dataIndex]})`;
    }
    setTimeout(() => this.chartObj.update(), 500);
  }

  getEachAnalysisGraphData(tableType:string) {
    this.resetCurrentGraphs();
    this.isAPIinProcess = true;
    this.isMultiSelectOn = false;
    const apiCacheKey = `${environment.apiurl}api/getWhatstrendingGraphData?year=${this.whatsTrandingYear}&direction=${this.directionType}&tableType=${tableType}`;
   
    const apiObj = {
      tableType, year: this.whatsTrandingYear,
      direction: this.directionType
    };

    if(environment.apiDataCache.hasOwnProperty(apiCacheKey)) {
      setTimeout(() => {
        //fetching values from cache
        if(["radar", "line"].includes(this.type)) {
          this.lineRadarDataValues = {...environment.apiDataCache[apiCacheKey]};
        } else if(this.type == "bar") { this.barGraphValues = {...environment.apiDataCache[apiCacheKey]}; }
        else { this.topCompanies = {...environment.apiDataCache[apiCacheKey]}; }
                
        //updating values in chart
        if(this.type == "bar") {this.updateBarChart();}
        else if(this.type=="pie") this.setGraphInterval(10);
        else this.setGraphInterval(12);
        this.isAPIinProcess = false;
      }, 1000);
    } else {
      if(this.apiSubscription2) this.apiSubscription2.unsubscribe();
      setTimeout(() => {
        this.apiSubscription2 = this.apiService.getWhatstrandingGraphData(apiObj).subscribe({
          next: (res:any) => {
            if(!res.error) {
              this.lineRadarDataValues = {months: [], percentages: [], values: []};
              this.barDataValues = {companies: [], values: []};
              this.topCompanies = {countries: [], values: []};
              const tempData = res.results;
              const dataLen = res.results.length;

              if(["radar", "line", "pie"].includes(this.type)) {
                for(let i=0; i<dataLen; i++) {
                  if(["radar", "line"].includes(this.type)) {
                    this.lineRadarDataValues.months.push(tempData[i]["month"]);
                    this.lineRadarDataValues.values.push(Number(tempData[i]["current_value"])/Math.pow(10,9));
                    this.lineRadarDataValues.percentages.push(tempData[i]["growth"]);
                    this.currentLinePercentage = this.lineRadarDataValues.percentages[0];
                  } else {
                    this.topCompanies.values.push(Number(tempData[i]["value"])/Math.pow(10,9));
                    this.topCompanies.countries.push(tempData[i]["country"]);
                  }
                }

                environment.apiDataCache[apiCacheKey] = JSON.parse(JSON.stringify(this.type=="pie" ? this.topCompanies : this.lineRadarDataValues));
                if(this.type=="pie") this.setGraphInterval(10);
                else this.setGraphInterval(12);
              } else if(this.type == "bar") {
                let isBarDataNotSet:boolean = true, i=0;
                const tempObj = {};

                while(isBarDataNotSet) {
                  if(!tempObj.hasOwnProperty(tempData[i]["company"])) {
                    tempObj[tempData[i]["company"]] = [tempData[i]];
                  } else {
                    (tempObj[tempData[i]["company"]]).push(tempData[i]);
                  }
                  i++;
                  if(i >= dataLen) {
                    isBarDataNotSet = false;
                    const objKeys = Object.keys(tempObj);
                    const data = [
                      { label: "", backgroundColor: "#50af48", data: [], hscode: [], maxBarThickness: 60}, 
                      { label: "", backgroundColor: "#40acf0", data: [], hscode: [], maxBarThickness: 60}, 
                      { label: "", backgroundColor: "#f8bf45", data: [], hscode: [], maxBarThickness: 60}
                    ];

                    for(let j=0; j<objKeys.length; j++) {
                      (data[0]["data"]).push(Number(tempObj[objKeys[j]][0]["value"])/Math.pow(10,9));
                      (data[1]["data"]).push(Number(tempObj[objKeys[j]][1]["value"])/Math.pow(10,9));
                      (data[2]["data"]).push(Number(tempObj[objKeys[j]][2]["value"])/Math.pow(10,9));
                      (data[0]["hscode"]).push(tempObj[objKeys[j]][0]["hscode"]);
                      (data[1]["hscode"]).push(tempObj[objKeys[j]][1]["hscode"]);
                      (data[2]["hscode"]).push(tempObj[objKeys[j]][2]["hscode"]);
                    }
                    data[0]["label"] = (data[0]["data"]).reduce((prev:number, current:number) => prev+current, 0).toFixed(2) + " Bn $";
                    data[1]["label"] = (data[1]["data"]).reduce((prev:number, current:number) => prev+current, 0).toFixed(2) + " Bn $";
                    data[2]["label"] = (data[2]["data"]).reduce((prev:number, current:number) => prev+current, 0).toFixed(2) + " Bn $";

                    // console.log("Got finally", data)
                    this.barGraphValues = {companies: objKeys, data};
                    environment.apiDataCache[apiCacheKey] = JSON.parse(JSON.stringify(this.barGraphValues));
                    this.updateBarChart();
                  }
                }
              }

              this.isAPIinProcess = false;
            }
          }, error: (err:any) => {}
        });
      }, 2000);
    }
  }



  pieCallBackTooltip(context:any) {
    const value = context.parsed || 0;
    const dataset = context.dataset || {};
    const total = dataset.data.reduce((previous: number, current: number) => previous + current, 0);
    const percentage = Math.round((value / total) * 100);
    return `${context.formattedValue} Bn $ (${percentage}%)`;
  }
}
