import { Component, OnInit, AfterViewInit, OnChanges, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js';
import { DatePipe } from "@angular/common";
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { Subscription, timer } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { ExcelService } from 'src/app/services/excel.service';
import { AlertifyService } from 'src/app/services/alertify.service';

@Component({
  selector: 'app-all-analysis',
  templateUrl: './all-analysis.component.html',
  styleUrls: ['./all-analysis.component.css']
})
export class AllAnalysisComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild("summaryContainer", { static: true }) summaryTable!: ElementRef;
  @Input() currentAnalysis:string = '';
  @Input() labelArr:string[] = [];
  currentCountry:string = "";
  controlBtns = {prev: true, next: false};
  doc:jsPDF = new jsPDF();

  summaryTableArr:any[] = [];
  quantityArr:number[] = [];
  valueArr:number[] = [];
  priceArr:number[] = [];
  currentTop:number = 5;
  
  summaryPartitionArr:any[] = [];
  totalPartition:number = 0;
  currentPartion:number = 0;

  barChartVertical:Chart;
  barChartHorizontal:Chart;
  lineChartLine1:Chart;
  lineChartLine2:Chart;
  pieChartPie1:Chart;
  pieChartPie2:Chart;
  pieChartPie3:Chart;
  pieChartPie4:Chart;

  canvasIds:string[] = [];

  ellipsePipe: EllipsisPipe = new EllipsisPipe();

  pieChartColors:string[] = ["#f44336d1","#e81e63d1","#9c27b0d1","#673ab7d1","#3f51b5d1","#2196f3d1","#03a9f4d1","#00bcd4d1","#009688d1","#4caf50d1","#8bc34ad1","#cddc39d1","#ffeb3bd1","#ffc107d1","#ff9800d1","#ff5722d1","#795548d1","#9e9e9ed1","#607d8bd1","#000000d1"];
  chartBgColor1 = ['#FFBF00', '#4cbfa6'];
  chartBgColor2 = ["#000", "#8d8d8d"];
  filterValues = {
    barY: [0, 0],
    barX: [0, 0],
    line1: [0, 0],
    line2: [0, 0]
  };

  fieldName:any = "";
  isLoading:boolean = true;
  lastSearchedQuery:any = {};
  analysisKey = {
    hscode: "HsCode",
    country: ["CountryofDestination", "CountryofOrigin"],
    time: "Date",
    supplier: "Exp_Name",
    buyer: "Imp_Name"
  }
  graphCopyData:any = {
    verticalBar: [],
    horizontalBar: [],
    line1Graph: [],
    line2Graph: [],
  };
  graphCopyCache = {
    verticalBar: [],
    horizontalBar: [],
    line1Graph: [],
    line2Graph: [],
  };

  keyHelper = {verticalBar: "barY", horizontalBar: "barX", line1Graph: "line1", line2Graph: "line2"};
  graphSearchTracker = {barX: "value", barY: "price", line1: "price", line2: "value"};

  // apiSubscription:Subscription;
  eventSubscription: Subscription;
  timerSubscription:{[key: `timerSubscription${number}`]:Subscription} = {};


  constructor(
    private eventService: EventemittersService,
    private apiService: ApiServiceService,
    private excelService:ExcelService,
    private datePipe: DatePipe,
    private alertService: AlertifyService
  ) {}
  
  convertor:Function = this.alertService.valueInBillion;

  ngOnChanges() {this.unsubscribeEvents(); }

  ngOnInit() {
    this.isLoading = true;
    let bgKey = this.currentAnalysis;
    if(bgKey == "hs code") bgKey = bgKey.replace(" ", "_");
    const isTagAlreadyAvailable = document.getElementById(`${bgKey}-canvas1`) as HTMLCanvasElement;

    if(!isTagAlreadyAvailable) { [1,2,3,4,5,6,7,8].forEach(val => this.canvasIds.push(`${bgKey}-canvas${val}`)); }

    
    this.timerSubscription["timerSubscription1"] = timer(1000).subscribe(() => this.getCurrentAnalysisData());
  }

  getCurrentAnalysisData() {
    this.eventSubscription = this.eventService.setAnalysisDataEvent.subscribe({
      next: (res:any) => {
        const {body, result} = res;
        if(Object.keys(res).length==0 || Object.keys(body).length == 0) {
          this.isLoading = false;
          return;
        }

        this.timerSubscription["timerSubscription2"]?.unsubscribe();

        this.timerSubscription["timerSubscription2"] = timer(90000).subscribe(() => {
          this.isLoading = false;
          // this.apiSubscription?.unsubscribe();
        });

        this.currentCountry = body["countryname"];
        this.resetAllValues();
        const queryObj = {...body};
        this.fieldName = this.analysisKey[this.currentAnalysis.replace(new RegExp(" ", "g"), "")];
        queryObj["fieldName"] = typeof this.fieldName == 'object' ? (queryObj["direction"]=="import" ? this.fieldName[1] : this.fieldName[0]) : this.fieldName;

        if(result[queryObj["fieldName"]].length>0) this.initiateAction(result[queryObj["fieldName"]]);
        else this.onAnalysisApiCall(queryObj);

      }, error: (err:any) => console.log(err)
    });
  }

  //just in case, data is not fetched properly then
  onAnalysisApiCall(queryObj:any) {
    // this.apiSubscription = 
    this.apiService.getAnalysisData(queryObj).subscribe({
      next: (res2:any) => {

        if(res2?.results[0].hasOwnProperty("asset_value_usd")) {
          for(let i=0; i<res2?.results.length; i++) {
            res2.results[i]["valueinusd"] = res2?.results[i]["asset_value_usd"];
          }
        }

        this.timerSubscription["timerSubscription3"] = timer(1000).subscribe(() => this.initiateAction(res2.results));
      }, error: (err:any) => {this.isLoading = false;}
    });
  }


  initiateAction(results:any) {
    if(results.length>0) {
      for(let i=0; i<results.length; i++) {
        const data = {...results[i]};
        if(this.fieldName == "Date") data["Date"] = this.datePipe.transform(data["Date"], "yyyy-MM-dd");
        data["priceShare"] = this.getAverage(results, data, this.isCountryIndia());
        data["valueShare"] = this.getAverage(results, data, "valueinusd");
        data["quantityShare"] = this.getAverage(results, data, "quantity");
        this.summaryTableArr[i] = data;

        if(i == results.length-1) {
          this.sortSummaryArr("valueinusd");
          this.getNumberOfTops(this.summaryTableArr);
          this.getPartitionTableData(this.summaryTableArr);
          this.isLoading = false;
        }
      }
    }  
  }



  ngAfterViewInit() {
    this.onSetBarGraph();
    this.onSetLineGraph();
    this.onSetPieChart();
  }

  ngOnDestroy() {
    this.unsubscribeEvents();
  }
  
  unsubscribeEvents() {
    Object.keys(this.timerSubscription).forEach((key:string) => this.timerSubscription?.[key]?.unsubscribe());
    this.eventSubscription?.unsubscribe();
    // this.apiSubscription?.unsubscribe();

    if(this.barChartHorizontal) {
      this.barChartVertical.destroy();
      this.barChartHorizontal.destroy();
      this.lineChartLine1.destroy();
      this.lineChartLine2.destroy();
      this.pieChartPie1.destroy();
      this.pieChartPie2.destroy();
      this.pieChartPie3.destroy();
      this.pieChartPie4.destroy();
    }
  }

  convertIntoString(val:any, shouldConvert:false) {
    const formatter = new Intl.NumberFormat();
    try {
      if(shouldConvert) return formatter.format(Number(val));
      else return this.convertor(Number(val)); //formatter.format(Number(val));      
    } catch (error) {
      return val;
    }
  }

  isCountryIndia():string {
    return this.currentCountry=="India" ? "unitpricefc" : "unitpriceusd";
  }

  resetAllValues() {
    this.summaryTableArr = [];
    this.quantityArr = [];
    this.valueArr = [];
    this.priceArr = [];
    this.currentTop = 5;
    this.graphCopyData = { verticalBar: [], horizontalBar: [], line1Graph: [], line2Graph: [] };
  }

  getPartitionTableData(arr, controller="") {
    if(controller == "prev") this.currentPartion--;
    else if(controller == "next") this.currentPartion++;

    const OFFSET = 20;
    const tempArr = [...arr];
    const initIndex = this.currentPartion * OFFSET;
    this.totalPartition = Math.ceil(tempArr.length / OFFSET);

    if(this.totalPartition > (this.currentPartion+1) || this.currentPartion+1 > 0) {
      this.summaryPartitionArr = tempArr.splice(initIndex, OFFSET);
    }

    this.controlBtns.prev = !(this.currentPartion > 0);
    this.controlBtns.next = !(this.totalPartition > this.currentPartion+1);

    this.summaryTable.nativeElement.scrollTop = 0;
  }

  sortSummaryArr(key:string, isMain=true) {
    const currentTable = JSON.parse(JSON.stringify(isMain ? this.summaryTableArr : this.summaryPartitionArr));
    if(isMain) this.summaryTableArr = currentTable.sort((item1:any, item2:any) => Number(item2[key]) - Number(item1[key]));
    else this.summaryPartitionArr = currentTable.sort((item1:any, item2:any) => Number(item2[key]) - Number(item1[key]));
  }

  parseFloat2Digit = (value, isNormal=true):string => {
    if(!isNormal) return parseFloat(value).toFixed(2);
    else return value;
  }

  getAverage(dataArr:any[], data, key):number {
    const total = dataArr.reduce((total, item) => total + Number(item[key]), 0);
    return Math.floor((Number(data[key])* 100) / total);
  }

  getNumberOfTops(summaryData:any[]) {
    const totalData = [...summaryData];
    this.labelArr = []; this.priceArr = []; this.valueArr = []; this.quantityArr = [];
    let tempValArr = []; const tempCopyArr = [];
    const currentRange = summaryData.length<this.currentTop ? summaryData.length : this.currentTop;
    for(let item of totalData) {tempValArr.push(Number(item["valueinusd"]))}; 
    for(let i=0; i<currentRange; i++) {
      const maxValue = Math.max(...tempValArr);
      const indexNum = tempValArr.indexOf(maxValue);
      tempValArr[indexNum] = 0;

      this.labelArr.push(totalData[indexNum][this.getColName()]);
      this.quantityArr.push(Number(totalData[indexNum]["quantity"]));
      this.valueArr.push(Number(totalData[indexNum]["valueinusd"]));
      this.priceArr.push(Number(totalData[indexNum][this.isCountryIndia()]));

      tempCopyArr.push(totalData[indexNum]);

      if(i == currentRange-1) {
        this.fillingInitData([...tempCopyArr]);
        this.timerSubscription["timerSubscription4"] = timer(1000).subscribe(() => this.updateAllChartGraphs());
      }
    }
  }

  fillingInitData(tempCopyArr) {
    if(this.isAnalysisCompany()) {
      this.labelArr = this.getSubStrLabels(this.labelArr);
    }

    this.graphCopyData.verticalBar = [...tempCopyArr];
    this.graphCopyData.horizontalBar = [...tempCopyArr];
    this.graphCopyData.line1Graph = [...tempCopyArr];
    this.graphCopyData.line2Graph = [...tempCopyArr];

    this.graphCopyCache.verticalBar = [...tempCopyArr];
    this.graphCopyCache.horizontalBar = [...tempCopyArr];
    this.graphCopyCache.line1Graph = [...tempCopyArr];
    this.graphCopyCache.line2Graph = [...tempCopyArr];
  }

  onChangeByTop(e) {
    if(this.summaryTableArr.length < 5) return;
    this.currentTop = e.target.value;
    this.getNumberOfTops(this.summaryTableArr);
  }


  onSetBarGraph() {
    const barYCanvasEle = document.getElementById(this.canvasIds[0]) as HTMLCanvasElement;
    const barXCanvasEle = document.getElementById(this.canvasIds[1]) as HTMLCanvasElement;

    this.barChartVertical = new Chart(barYCanvasEle.getContext('2d'), this.getBarConfigOpts(false, 'Price', 'Quantity'));
    this.barChartHorizontal = new Chart(barXCanvasEle.getContext('2d'), this.setHorizontalConfig('Value', 'Quantity'));
  }

  onSetPieChart() {
    //second last two pie-charts
    const pie1CanvasEle = document.getElementById(this.canvasIds[4]) as HTMLCanvasElement;
    const pie2CanvasEle = document.getElementById(this.canvasIds[5]) as HTMLCanvasElement;
    
    //last two pie-charts
    const pie3CanvasEle = document.getElementById(this.canvasIds[6]) as HTMLCanvasElement;
    const pie4CanvasEle = document.getElementById(this.canvasIds[7]) as HTMLCanvasElement;
  
    this.pieChartPie1 = new Chart(pie1CanvasEle.getContext('2d'), this.getPieConfigOpts('Price', 'Value'));
    this.pieChartPie2 = new Chart(pie2CanvasEle.getContext('2d'), this.getPieConfigOpts('Value', 'Quantity'));
    this.pieChartPie3 = new Chart(pie3CanvasEle.getContext('2d'), this.getPieConfigOpts('Value', 'Quantity'));
    this.pieChartPie4 = new Chart(pie4CanvasEle.getContext('2d'), this.getPieConfigOpts('Value', 'Quantity'));
  }

  onSetLineGraph() {
    const line1CanvasEle = document.getElementById(this.canvasIds[2]) as HTMLCanvasElement;
    const line2CanvasEle = document.getElementById(this.canvasIds[3]) as HTMLCanvasElement;
    const dataParams = [
      {label: 'Price', data: this.priceArr},
      {label: 'Value', data: this.valueArr},
      {label: 'Quantity', data: this.quantityArr}
    ];

    this.lineChartLine1 = new Chart(line1CanvasEle.getContext('2d'), this.getLineConfigOpts(dataParams[0], dataParams[1]));
    this.lineChartLine2 = new Chart(line2CanvasEle.getContext('2d'), this.getLineConfigOpts(dataParams[1], dataParams[2]));
  }

  getPieConfigOpts(label, label2):any {
    return {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: "#f5f8ff",
          // borderColor: "black",
          borderWidth: 0.3,
          hoverOffset: 4
        }]
      },
      options: {
        animation: true,
        responsive: true,
        plugins: {legend: {position: "bottom", labels: {font: {size: 14}}}},
        maintainAspectRatio: false,
        scales: {
          x: {grid: {display: false},ticks: {display: false},border: {display: false}},
          y: {grid: {display: false},ticks: {display: false},border: {display: false}}          
        }
      }
    };
  }

  getLineConfigOpts(data1, data2):any {    
    return {
      type: 'line',
      data: {
        labels: this.labelArr,
        datasets: [{
          label: data1.label,
          data: data1.data,
          fill: false,
          yAxisID: 'y',
          backgroundColor: this.chartBgColor1[0],
          borderColor: this.chartBgColor1[0],
          borderWidth: 1,
          pointRadius: 5,
          pointBorderColor: '#fff',
          pointBackgroundColor: this.chartBgColor1[0],
          tension: 0
        },
        {
          label: data2.label,
          data: data2.data,
          fill: false,
          yAxisID: 'y1',
          backgroundColor: this.chartBgColor1[1],
          borderColor: this.chartBgColor1[1],
          borderWidth: 1,
          pointRadius: 5,
          pointBorderColor: '#fff',
          pointBackgroundColor: this.chartBgColor1[1],
          tension: 0
        }]        
      },
      options: {
        animation: true,
        responsive: true,
        plugins: {legend: {position: "top", labels: {font: {size: 14}}}},
        maintainAspectRatio: false,
        scales: {
          x: {grid: {display: false},ticks: {font: {size: this.isAnalysisCompany() ? 13 : 17}, color: "black"}, title: {display: true, text: this.currentAnalysis, font:{size:18,weight:'bold'}, color: "black"}},
          y: {grid: {display: true}, 
            ticks: {
              font: {size: 17}, color: "black",
              callback: (value) => data1.label=="Price" 
                ? `$${value/1000}K` 
                : data1.label=="Value" 
                  ? `${value/1000}K` : value
            }, 
            title: {display: true, text: data1.label, font:{size:18,weight:'bold'}, color: "black"}},
          y1: {grid: {display: false}, position: 'right', ticks: {font: {size: 17}, callback: (value) => data2.label=="Value" ? `${value/1000}K` : value, color: "black"}, title: {display: true, text: data2.label, font:{size:18,weight:'bold'}, color: "black"}}
        }
      }
    };
  }


  getBarConfigOpts(isVertical=false, label2:any, label3:any):any {
    return {
      data: {
        labels: this.labelArr,
        datasets: [
          {
            type: "line",
            label: label2,
            yAxisID: 'y1',
            data: this.priceArr,
            borderWidth: 1,
            pointRadius: 5,
            backgroundColor: "#FFBF00",
            borderColor: "#FFBF00",
            pointBorderColor: "transparent",
            pointBackgroundColor: '#FFBF00'
          },
          {
            type: "bar",
            yAxisID: 'y',
            label: label3,
            data: this.quantityArr,
            backgroundColor: "#4cbfa6",
            borderColor: "#4cbfa6",
            borderWidth: 1,
            maxBarThickness: 40
          },
        ]
      },
      options: {
        animation: true,
        indexAxis: isVertical ? 'y' : 'x',
        plugins: {
         legend: {position: "top", labels: {font: {size: 14}}}
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {grid: {display: false}, 
          ticks: {font: {size: this.isAnalysisCompany() ? 13 : 17}, color: "black"}, title: {display: true, text: this.currentAnalysis, font:{size:18,weight:'bold'}, color: "black"}},
          y: {grid: {display: true}, ticks: {font: {size: 17}, callback: (value) => `${value/1000}K`, color: "black"}, title: {display: true, text: "Price", font:{size:18,weight:'bold'}, color: "black"}},
          y1:{position: 'right', grid: {display: false}, ticks: {font: {size: 17}, color: "black"}, title: {display: true, text: "Quantity", font:{size:18,weight:'bold'}, color: "black"}}
        }
      }
    }
  }

  setHorizontalConfig(label, label2):any {
    return {
      type: 'bar',
      data: {
        labels: this.labelArr,
        datasets: [
          {
            label: label,
            data: this.quantityArr,
            borderWidth: 0.3,
            xAxisID: 'x1',
            borderColor: 'black',
            backgroundColor: '#FFBF00',
            maxBarThickness: 15
          },
          {
            label: label2,
            data: this.valueArr,
            xAxisID: 'x',
            backgroundColor: '#4cbfa6',
            borderColor: 'gray',
            borderWidth: 0.5,
            maxBarThickness: 15
          }
        ]
      },
      options: {
        animation: true,
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {legend: {position: "top", labels: {font: {size: 14}}}},
        scales: {
          x: {grid: {display: false},ticks: {font: {size: 17}, callback: (value) => `${value/1000}K`, color: "black"}, title: {display: true, text: "Value", font:{size:18,weight:'bold'}, color: "black"}},
          y: {display: true, grid: {display: false}, position: 'bottom',ticks: {font: {size: this.isAnalysisCompany() ? 13 : 17}, color: "black"}, title: {display: true, text: this.currentAnalysis, font:{size:18,weight:'bold'}, color: "black"}},
          x1: {display: true, grid: {display: true}, position: 'top',ticks: {font: {size: 17}, color: "black"}, title: {display: true, text: "Quantity", font:{size:18,weight:'bold'}, color: "black"}}
        }
      }
    }
  }


  updateAllChartGraphs() {
    this.lineChartLine1.data.labels = this.labelArr;
    this.lineChartLine1.data.datasets[0].data = this.priceArr;
    this.lineChartLine1.data.datasets[1].data = this.valueArr;

    this.lineChartLine2.data.labels = this.labelArr;
    this.lineChartLine2.data.datasets[0].data = this.valueArr;
    this.lineChartLine2.data.datasets[1].data = this.quantityArr;
              
    this.barChartHorizontal.data.labels = this.labelArr;
    this.barChartHorizontal.data.datasets[0].data = this.valueArr;
    this.barChartHorizontal.data.datasets[1].data = this.quantityArr;

    this.barChartVertical.data.labels = this.labelArr;
    this.barChartVertical.data.datasets[0].data = this.priceArr;
    this.barChartVertical.data.datasets[1].data = this.quantityArr;

    const line1Pie1Data = this.getPieCharShare([...this.graphCopyData.line1Graph], 'line1', 'price');
    const line1Pie2Data = this.getPieCharShare([...this.graphCopyData.line1Graph], 'line1', 'value');
    const line2Pie1Data = this.getPieCharShare([...this.graphCopyData.line2Graph], 'line2', 'value');
    const line2Pie2Data = this.getPieCharShare([...this.graphCopyData.line2Graph], 'line2', 'quantity');
    this.pieChartPie1.data.labels = line1Pie1Data[0];
    this.pieChartPie1.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line1Pie1Data[0].length);
    this.pieChartPie1.data.datasets[0].data = line1Pie1Data[1];
    this.pieChartPie1.options.plugins.tooltip.callbacks.label = this.callbackLabelFun;

    this.pieChartPie2.data.labels = line1Pie2Data[0];
    this.pieChartPie2.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line1Pie2Data[0].length);
    this.pieChartPie2.data.datasets[0].data = line1Pie2Data[1];
    this.pieChartPie2.options.plugins.tooltip.callbacks.label = this.callbackLabelFun;

    this.pieChartPie3.data.labels = line2Pie1Data[0];
    this.pieChartPie3.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line2Pie1Data[0].length);
    this.pieChartPie3.data.datasets[0].data = line2Pie1Data[1];
    this.pieChartPie3.options.plugins.tooltip.callbacks.label = this.callbackLabelFun;

    this.pieChartPie4.data.labels = line2Pie2Data[0];
    this.pieChartPie4.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line2Pie2Data[0].length);
    this.pieChartPie4.data.datasets[0].data = line2Pie2Data[1];
    this.pieChartPie4.options.plugins.tooltip.callbacks.label = this.callbackLabelFun;

    this.lineChartLine1.update();
    this.lineChartLine2.update();
    this.pieChartPie1.update();
    this.pieChartPie2.update();
    this.pieChartPie3.update();
    this.pieChartPie4.update();
    this.barChartHorizontal.update();
    this.barChartVertical.update();
  }


  onToggleSwitch(e, graph, elem) {
    this.filterValues[graph] = [0, 0]; //reset input values

    const isOn = e.target.checked;
    const btnColors = ["#ffbf00", "#4cbfa6"];
    const keyType = {
      barY: {true: 'quantity', false: 'price'},
      barX: {true: 'quantity', false: 'value'},
      line1: {true: 'value', false: 'price'},
      line2: {true: 'quantity', false: 'value'}
    };

    const spanTag = elem.children[0];
    const buttonTag = elem.children[elem.children.length-2];
    spanTag.innerText = keyType[graph][`${isOn}`];
    this.graphSearchTracker[graph] = keyType[graph][`${isOn}`];
    buttonTag.style.backgroundColor = isOn ? btnColors[1] : btnColors[0];
     
    this.individualGraphSortingUpdate("sorting", graph, keyType[graph][`${isOn}`]);
  }

  onApplyMinMax(graph) {
    this.individualGraphSortingUpdate("searching", graph, this.graphSearchTracker[graph]);
  }

  resetSingleGraph(type) {
    this.individualGraphSortingUpdate("reset", type, "");
    this.filterValues[type] = [0, 0];
  }

  individualGraphSortingUpdate(actionType, graph, toggleType) {
    const analysisKey =  this.getColName();
    const keys = [analysisKey, "quantity", "valueinusd", this.isCountryIndia()];
    
    if(graph == "barY") {
      const dataArr = this.arrayOperationType(actionType, toggleType, {arrKey: "verticalBar", toggleInit: "price", key1: keys[3], key2: keys[1]});  
      this.barChartVertical.data.labels = this.getObjArray(dataArr, keys[0]);
      this.barChartVertical.data.datasets[0].data = this.getObjArray(dataArr, keys[3]);
      this.barChartVertical.data.datasets[1].data = this.getObjArray(dataArr, keys[1]);
      this.barChartVertical.update();
    } else if(graph == "barX") {
      const dataArr = this.arrayOperationType(actionType, toggleType, {arrKey: "horizontalBar", toggleInit: "value", key1: keys[2], key2: keys[1]});
      this.barChartHorizontal.data.labels = this.getObjArray(dataArr, keys[0]);
      this.barChartHorizontal.data.datasets[0].data = this.getObjArray(dataArr, keys[2]);
      this.barChartHorizontal.data.datasets[1].data = this.getObjArray(dataArr, keys[1]);
      this.barChartHorizontal.update();
    } else if(graph == "line1") {  
      const dataArr = this.arrayOperationType(actionType, toggleType, {arrKey: "line1Graph", toggleInit: "price", key1: keys[3], key2: keys[2]});
      this.lineChartLine1.data.labels = this.getObjArray(dataArr, keys[0]);
      this.lineChartLine1.data.datasets[0].data = this.getObjArray(dataArr, keys[3]);
      this.lineChartLine1.data.datasets[1].data = this.getObjArray(dataArr, keys[2]);
      this.lineChartLine1.update();
      
      //pie-char update
      const line1Pie1Data = this.getPieCharShare(dataArr, 'line1', 'price');
      const line1Pie2Data = this.getPieCharShare(dataArr, 'line1', 'value');
      this.pieChartPie1.data.labels = line1Pie1Data[0];
      this.pieChartPie1.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line1Pie1Data[0].length);
      this.pieChartPie1.data.datasets[0].data = line1Pie1Data[1];

      this.pieChartPie2.data.labels = line1Pie2Data[0];
      this.pieChartPie2.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line1Pie2Data[0].length);
      this.pieChartPie2.data.datasets[0].data = line1Pie2Data[1];
      
      this.pieChartPie1.update();
      this.pieChartPie2.update();
    } else if(graph == "line2") {
      const dataArr = this.arrayOperationType(actionType, toggleType, {arrKey: "line2Graph", toggleInit: "value", key1: keys[2], key2: keys[1]});
      this.lineChartLine2.data.labels = this.getObjArray(dataArr, keys[0]);
      this.lineChartLine2.data.datasets[0].data = this.getObjArray(dataArr, keys[2]);
      this.lineChartLine2.data.datasets[1].data = this.getObjArray(dataArr, keys[1]);
      this.lineChartLine2.update();

      //pie-char update
      const line2Pie1Data = this.getPieCharShare(dataArr, 'line2', 'value');
      const line2Pie2Data = this.getPieCharShare(dataArr, 'line2', 'quantity');
      this.pieChartPie3.data.labels = line2Pie1Data[0];
      this.pieChartPie3.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line2Pie1Data[0].length);
      this.pieChartPie3.data.datasets[0].data = line2Pie1Data[1];

      this.pieChartPie4.data.labels = line2Pie2Data[0];
      this.pieChartPie4.data.datasets[0].backgroundColor = this.pieChartColors.slice(0, line2Pie2Data[0].length);
      this.pieChartPie4.data.datasets[0].data = line2Pie2Data[1];

      this.pieChartPie3.update();
      this.pieChartPie4.update();
    }
  }

  getPieCharShare(dataArr:any[], type:string, key:string):any[] {
    const shareArr = [];
    const labelArr = [];

    for(let i=0; i<dataArr.length; i++) {
      shareArr.push(dataArr[i][`${key}Share`]);
      labelArr.push(this.ellipsePipe.transform(dataArr[i][this.getColName()], 15));
    }
    
    return [labelArr, shareArr];
  }


  arrayOperationType(action, toggleType, objKey):any[] {
    if(action == "sorting") {
      return this.sortArrayInOrder(this.graphCopyData[objKey?.arrKey], toggleType==objKey?.toggleInit ? objKey?.key1 : objKey?.key2);
    } else if(action == "searching") {
      const keys = {quantity: "quantity", value: "valueinusd", price: this.isCountryIndia()};
      const dataArr = [...(this.graphCopyData[objKey?.arrKey])];
      const values = {
        min: Number(this.filterValues[this.keyHelper[objKey?.arrKey]][0]), 
        max: Number(this.filterValues[this.keyHelper[objKey?.arrKey]][1])
      };
      const tempArr = [];
      for(let i=0; i<dataArr.length; i++) {
        if(values.min <= Number(dataArr[i][keys[toggleType]]) && values.max >= Number(dataArr[i][keys[toggleType]])) {
          tempArr.push(dataArr[i]);
        }
        
        if(i == dataArr.length-1) {
          this.graphCopyData[objKey?.arrKey] = [...tempArr];
          return tempArr;
        }
      }
    } else if(action == "reset") {
      this.graphCopyData[objKey?.arrKey] = [...(this.graphCopyCache[objKey?.arrKey])];
      const tempArr = [...(this.graphCopyData[objKey?.arrKey])];
      return tempArr;
    }
  }

  sortArrayInOrder(dataArr, key):any[] {
    const tempValArr = dataArr;
    tempValArr.sort((a:any, b:any) => b[key] - a[key]);
    return tempValArr;
  }

  getColName():string {
    return (this.currentAnalysis=="country" && (this.summaryTableArr[0]).hasOwnProperty("CountryofOrigin")) 
    ? this.analysisKey[this.currentAnalysis][1] : (this.currentAnalysis=="country" && (this.summaryTableArr[0]).hasOwnProperty("CountryofDestination"))
      ? this.analysisKey[this.currentAnalysis][0] : this.analysisKey[this.currentAnalysis.replace(new RegExp(" ", "g"), "")];
  }

  getObjArray(data, key):any[] {
    const keys = ["quantity", "valueinusd", this.isCountryIndia()];
    const tempArr = [];

    for(let i=0; i<data.length; i++) {
      const value = keys.includes(key) ? Number(data[i][key]) : data[i][key];
      tempArr.push(value);

      if(i==data.length-1) {
        if(!keys.includes(key) && this.analysisKey) return this.getSubStrLabels(tempArr);
        else return tempArr;
      }
    }
  }


  hideGraphTable(event, id:string) {
    const imgTag = event.target as HTMLImageElement;
    imgTag.src = imgTag.src.includes("hideTable") ? imgTag.src.replace("hideTable", "showTable") : imgTag.src.replace("showTable", "hideTable");
    const currentSection = document.getElementById(id) as HTMLDivElement;
    currentSection.classList.toggle('hide');
  }  

  isAnalysisCompany():boolean {
    return ["buyer", "supplier"].includes(this.currentAnalysis);
  }

  getSubStrLabels(arr:string[]):string[] {
    const newArr = arr.map(item => item.substring(0, 15) + "...");
    return newArr
  }

  downloadSummary() {
    if(this.summaryTableArr.length==0) return;

    const date = new Date();
    const analysisName = this.currentAnalysis.replace(new RegExp(" ", "g"), "");
    const fitZero = (num) => (Number(num) <= 9) ? "0"+num : num;
    const dateInDigit = `${fitZero(date.getDate())}${fitZero(date.getMonth())}${date.getFullYear()}`;
    const filename = `SUMMARY-${analysisName.toUpperCase()}-${dateInDigit}`;
    this.excelService.exportAsExcelFile(this.summaryTableArr, filename);
  }


  downloadPDF(elem, type:string) {
    const imgTagsArr = [], dataUrls = []; //canvasParentArr = [], 
    const containerElem = document.createElement("div");
    containerElem.setAttribute("class", "analysis-container w-100 h-100");
    containerElem.innerHTML = elem.innerHTML;
    const canvasArr = containerElem.querySelectorAll("canvas");
// const tableTag = document.getElementById("tableContainer") as HTMLDivElement;
    for(let i=0; i<canvasArr.length; i++) {
      const canvasBase64 = canvasArr[i].toDataURL();
      dataUrls.push(canvasBase64);
      const imgTag = document.createElement("img");
      imgTag.setAttribute("style", "width:100%;height:100%;object-fit:contain;");
      imgTag.src = canvasBase64;
      imgTagsArr.push(imgTag);
      this.doc.addImage(canvasBase64, "png", 0, 100*i, 200, 100);
      // canvasParentArr.push(canvasArr[i].parentElement);
    }

    // console.log(canvasArr);

    const tableObj = this.getTableInArr(this.summaryTableArr);
    autoTable(this.doc, {
      theme: "grid",
      showHead: "firstPage",
      head: tableObj["head"],
      body: tableObj["body"],
    });

    // this.doc.addImage(dataUrls[0], "png", 0, 0, 200, 100);
    // this.doc.addImage(dataUrls[0], "JPEG", 0, 0, 200, 100);
    // this.doc.addImage(dataUrls[0], "WEBP", 0, 0, 200, 100);

    
    this.doc.save("table.pdf");
    // for(let j=0; j<canvasParentArr.length; j++) {
    //   canvasParentArr[j].replaceChild(imgTagsArr[j], canvasArr[j]);

    //   if(j == canvasParentArr.length-1) {
    //     this.jsPDF.html(containerElem, {
    //       callback: () => this.jsPDF.save("trial.pdf"),
    //       margin: [10, 10, 10, 10],
    //       autoPaging: "text",
    //       x: 0,
    //       y: 0,
    //       // width: 0,
    //       // windowWidth: 0
    //     })
    //   }
    // }
  }

  getTableInArr(tableArr:any[]) {
    const theads = [Object.keys(tableArr[0])];
    const tbody = [];
    
    for(let i=0; i<tableArr.length; i++) {
      const tr = Object.values(tableArr[i]);
      tbody.push(tr);

      if(i == tableArr.length-1) {
        const tableObj = {head: theads, body: tbody};
        return tableObj;
      }
    }
  }

  linkToDataSearch(value:string) {
    if(this.getColName() == "Date" || this.currentCountry!="India") return; 

    const analysisKey = {
      CountryofDestination: "Country", CountryofOrigin: "Country",
      HsCode: "HS Code", Exp_Name: "Supplier", Imp_Name: "Buyer"
    };

    const tableTabTag = document.getElementById("TableTab") as HTMLDivElement;
    if(tableTabTag) tableTabTag.click();
    const currentAnalysisKey = analysisKey[this.getColName()];
    const selectedItem = { id: `${currentAnalysisKey=="HS Code" ? "HsCode": currentAnalysisKey} ${value}`.toLowerCase().replace(new RegExp(" ", "g"), "_"), value };

    if(currentAnalysisKey=="HS Code") selectedItem["id"] = selectedItem["id"].replace("hscode", "HsCode");

    this.eventService.applyFromAnalysisData.next({
      name: currentAnalysisKey,
      actualKey: this.getColName(),
      selectedItem
    });
  }

  callbackLabelFun(context: any) {
    // const label = context.label || '';
    const value = context.parsed || 0;
    const dataset = context.dataset || {};
    const total = dataset.data.reduce((previous: number, current: number) => previous + current, 0);
    const percentage = Math.round((value / total) * 100);
    return `${percentage}%`;
  }
}


