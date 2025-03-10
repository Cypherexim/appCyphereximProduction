import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { AlertifyService } from 'src/app/services/alertify.service';
import { DatePipe } from '@angular/common';
import { SaveFileComponent } from '../../side-filter/modals/save-file/save-file.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { ConfirmationComponent } from '../../workstation/modals/confirmation/confirmation.component';

@Component({
  selector: 'app-custom-analysis',
  templateUrl: './custom-analysis.component.html',
  styleUrls: ['./custom-analysis.component.css']
})
export class CustomAnalysisComponent implements OnInit, OnDestroy {
  constructor(
    private eventService: EventemittersService,
    private alertService: AlertifyService,
    private datepipe: DatePipe,
    private modalService: NgbModal,
    private apiService: ApiServiceService,
    private authService:AuthService
  ) {}

  convertor:Function = this.alertService.valueInBillion;
  eventSubscription:Subscription = new Subscription();

  tableSearchedData:any = {};
  errorFlags:number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  pieChartColors:string[] = ["#f44336d1","#e81e63d1","#9c27b0d1","#673ab7d1","#3f51b5d1","#2196f3d1","#03a9f4d1","#00bcd4d1","#009688d1","#4caf50d1","#8bc34ad1","#cddc39d1","#ffeb3bd1","#ffc107d1","#ff9800d1","#ff5722d1","#795548d1","#9e9e9ed1","#607d8bd1","#000000d1"];
  analysisType:any[] = [
    {analysis: "hs code", key: "HsCode"},
    {analysis: "country", key: ""},
    {analysis: "time", key: "Date"},
    {analysis: "buyer", key: "Imp_Name"},
    {analysis: "supplier", key: "Exp_Name"},
  ];
  chartType:any[] = [
    {chart: "pie", key: "pie"},
    {chart: "bar", key: "bar"},
    {chart: "line", key: "line"},
    {chart: "radar", key: "radar"},
    {chart: "doughnut", key: "doughnut"},
    {chart: "polar area", key: "polarArea"},
    {chart: "Combined", key: "mixed"}
  ];
  chartTypeMix:any[] = [
    {chart: "bar"},
    {chart: "line"},
    // {chart: "scatter"}
  ];
  yAxisType:any[] = [
    {axis: "value", key: "valueinusd"},
    {axis: "price", key: "unitpricefc"},
    {axis: "quantity", key: "quantity"}
  ];
  
  allChartsVarList:Chart[] = [];
  allCustomGraph:any[] = [];
  dbSavedCustomGraph:any[] = [];

  workspaceId:any = 0;
  editableGraphIndex:number = 0;
  isPreviewOpen:boolean = false;
  isPreviewLoading:boolean = false;
  isImgPrevExist:boolean = true;
  previewChartVar:Chart;
  isPalleteOpen:boolean = false;
  isEditPallete:boolean = false;
  isLoading:boolean = false;
  selectedAnalysis:string = "";
  mainSelectedChart:string = "";
  graphHead:string = "";
  dataRange:number = 0;
  mixedCharts = {type1: "", type2: ""};
  yAxisValues = {y1: "", y2: ""};



  ngOnInit(): void {
    this.getAnalysisData();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  openPellet(isNewChart:boolean=true, editChartData:any={}, indexNum:number=0) {
    this.isPalleteOpen = !this.isPalleteOpen;    
    console.log(editChartData);

    if(!isNewChart) {
      this.isEditPallete = true;
      const { analysisType, graphType, dataRange, graphTitle, tableType } = editChartData;
      this.selectedAnalysis = analysisType;
      this.mainSelectedChart = graphType;
      this.dataRange = dataRange;
      this.graphHead = graphTitle;
      this.editableGraphIndex = indexNum;
      this.mixedCharts = {type1: editChartData?.chartType1, type2: editChartData?.chartType2 || ""};
      this.yAxisValues = {y1: editChartData?.axis1Type, y2: editChartData?.axis2Type || ""};      
    }
  }

  destroyAllCharts() { this.allChartsVarList.forEach((item:Chart) => item.destroy()); }
  clearAllVars() {
    this.selectedAnalysis = "";
    this.mainSelectedChart = "";
    this.graphHead = "";
    this.dataRange = 0;
    this.mixedCharts = {type1: "", type2: ""};
    this.yAxisValues = {y1: "", y2: ""};
  }

  resetEverything() {
    this.isEditPallete = false;
    this.isPalleteOpen = false;
    this.isPreviewOpen = false;
    this.isImgPrevExist = true;
    this.isPreviewLoading = false;
    this.selectedAnalysis = "";
    this.mainSelectedChart = "";
    this.graphHead = "";
    this.editableGraphIndex = 0;
    this.mixedCharts = {type1: "", type2: ""};
    this.yAxisValues = {y1: "", y2: ""};
    if(this.previewChartVar) {this.previewChartVar.destroy();}    
    this.errorFlags = [0, 0, 0, 0, 0, 0, 0, 0];
  }


  getAnalysisData() {
    //get analysis full data
    this.eventSubscription = this.eventService.setAnalysisDataEvent.subscribe({
      next: (res:any) => {
        const {body, result} = res;
        console.log(res);
        const currentDirection = body?.direction;
        
        this.analysisType[1]["key"] = currentDirection=="import" ? "CountryofOrigin": "CountryofDestination";
        if(Object.keys(res).length>0 || Object.keys(body).length>0) { 
          this.tableSearchedData = result; 
          console.log(this.tableSearchedData)
        }
      }, error: (err:any) => console.log(err)
    });

    //get cutom analysis saved data
    this.eventService.sendChoosenWorkspace.subscribe({
      next: (res:any) => {
        console.log(res);
        this.workspaceId = res?.id;

        if(res.hasOwnProperty("graphs") && res.graphs!=null && JSON.parse(res.graphs).length>0) {
          this.isLoading = true;
          this.dbSavedCustomGraph = JSON.parse(res.graphs); 
          
          this.allCustomGraph = JSON.parse(JSON.stringify(this.dbSavedCustomGraph));
          setTimeout(() => { this.startAttachingAllGraphs(); }, 1500);
        }
        // else {
        //   if(sessionGraphs!=null && sessionGraphs.length>0) {
        //     this.isLoading = true;
        //     this.allCustomGraph = sessionGraphs;            
        //     setTimeout(() => { this.startAttachingAllGraphs(); }, 1500);
        //   }
        // }
      }
    });
  }


  async onClickApply(isSaved:boolean=true, callByPreview:boolean=false) {
    if(this.graphFormValidation()) {
      if(!callByPreview) {
        this.isLoading = true;
        this.isPreviewOpen = false;
        this.isImgPrevExist = true;
        if(this.previewChartVar) {this.previewChartVar.destroy();}
      }
  
      const graphData = this.tableSearchedData[this.selectedAnalysis];
      const sortedArr = await this.getTopValueDate(JSON.parse(JSON.stringify(graphData)), this.dataRange);
      let chartObj = {
        id: !callByPreview ? `chart-${uuid.v4()}`: "previewContainer",
        analysisType: this.selectedAnalysis,
        graphType: this.mainSelectedChart,
        dataRange: this.dataRange,
        graphTitle: this.graphHead==""?"Unnamed Graph":this.graphHead,
        axis1Type: this.yAxisValues.y1,
        data: sortedArr,
        tableType: this.selectedAnalysis.toLowerCase().includes("country") ? "Country" : this.selectedAnalysis
      }
      if(this.mainSelectedChart=="mixed") {
        chartObj["axis2Type"] = this.yAxisValues.y2;
        chartObj["chartType1"] = this.mixedCharts.type1;
        chartObj["chartType2"] = this.mixedCharts.type2;
      }
  
      if(!callByPreview) {
        if(!this.isEditPallete) {
          this.allCustomGraph.unshift(chartObj);
          this.dbSavedCustomGraph.unshift(chartObj);
        } else {
          this.allCustomGraph[this.editableGraphIndex] = chartObj;
          this.dbSavedCustomGraph[this.editableGraphIndex] = chartObj;
        }
        this.isPalleteOpen = false;
        this.updateGraphOnEvent(this.dbSavedCustomGraph);
    
        this.destroyAllCharts();
    
        setTimeout(() => {
          if(isSaved) { this.saveCharts(true); }
          this.startAttachingAllGraphs();
        }, 1500);
      } else { 
        this.isPreviewOpen = true;
        this.isPreviewLoading = true;
        if(this.previewChartVar) {this.previewChartVar.destroy();}
        setTimeout(() => {
          this.isImgPrevExist = false;
          this.showChartPreview(chartObj);
        }, 1500);
      }    
    }
  }

  updateGraphOnEvent(updatedArr:any[]) {
    this.eventService.sendChoosenWorkspace.next({
      id: this.workspaceId,
      graphs: JSON.stringify(updatedArr)
    });
  }

  getTopValueDate(dataArr:any[], top:number) {
    return new Promise(async(resolve, reject) => {
      const sortingKey = this.yAxisValues.y1;
      const sortedArr = await dataArr.sort((a, b) => b[sortingKey] - a[sortingKey]);
      const slicedArr = sortedArr.splice(0, top);
      
      if(this.selectedAnalysis=="Date") { for(let i=0; i<slicedArr.length; i++) {slicedArr[i]["Date"] = this.datepipe.transform(slicedArr[i]["Date"], "YYYY-MM-dd");} }
      
      resolve(slicedArr);
    });
  }

  startAttachingAllGraphs() {
    const graphsList = this.allCustomGraph.length;
    for(let i=0; i<graphsList; i++) {
      const graphType = this.allCustomGraph[i]["graphType"];
      this.yAxisValues.y1 = this.allCustomGraph[i]["axis1Type"];
      
      if(["pie","doughnut","polarArea"].includes(graphType)) {this.generateRoundChart(this.allCustomGraph[i], graphType);}
      else if(graphType=="bar") {this.generateBarChart(this.allCustomGraph[i]);}
      else if(graphType=="line") {this.generateLineChart(this.allCustomGraph[i]);}
      else if(graphType=="radar") {this.generateRadarChart(this.allCustomGraph[i]);}
      else if(graphType=="mixed") {
        this.yAxisValues.y2 = this.allCustomGraph[i]["axis2Type"];
        this.generateMixedChart(this.allCustomGraph[i]);
      }
      
      if(i==graphsList-1) {
        this.clearAllVars();
        this.isLoading = false;
      }
    }
  }


  showChartPreview(chartObj:any) {    
    const {graphType} = chartObj;
    if(["pie","doughnut","polarArea"].includes(graphType)) {this.generateRoundChart(chartObj, graphType);}
    else if(graphType=="bar") {this.generateBarChart(chartObj);}
    else if(graphType=="line") {this.generateLineChart(chartObj);}
    else if(graphType=="radar") {this.generateRadarChart(chartObj);}
    else if(graphType=="mixed") {this.generateMixedChart(chartObj);}
    this.isPreviewLoading = false;
  }


  generateRoundChart(pieData:any, chartType:any) {
    const {id, analysisType, graphType, dataRange, graphTitle, axis1Type, data} = pieData;
    const roundChart = document.getElementById(id) as HTMLCanvasElement;
    const roundLabel = this.yAxisValues.y1.includes("value") ? "Value in $": this.yAxisValues.y1.includes("price")? "Price in $": "Quantity";
    const scalingConfig = {
      x: {grid: {display: false},ticks: {display: false},border: {display: false}},
      y: {grid: {display: false},ticks: {display: false},border: {display: false}},      
    }
    if(chartType=="polarArea") {
      scalingConfig["r"] = {
        ticks: { font: {size: 14}, 
        callback: (value:any) => ["Price","Value"].includes(roundLabel) ? `${value/1000000}` : `${value/1000}` }
      }
    }
    
    let labels:string[] = [], values:any[] = [];    
    for(let i=0; i<data.length; i++) {
      labels.push(data[i][analysisType]);
      values.push(data[i][axis1Type]);
    }

    const pieChartVar = new Chart(roundChart.getContext('2d'), {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          label: `${roundLabel} (in ${this.getUnit(roundLabel)})`,
          data: values,
          backgroundColor: this.pieChartColors,
          borderWidth: 0.3,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        animation: {duration: 1000,easing: "easeInOutQuad"},
        plugins: {legend: {position: "bottom", labels: {font: {size: 14}}}
        },
        maintainAspectRatio: false,
        scales: scalingConfig
      }
    });
    if(!this.isPreviewOpen) this.allChartsVarList.push(pieChartVar);
    else {this.previewChartVar = pieChartVar; }
  }

  generateBarChart(barData:any) {
    const {id, analysisType, graphType, dataRange, graphTitle, axis1Type, data} = barData;
    const barChart = document.getElementById(id) as HTMLCanvasElement;
    const barLabel = this.yAxisValues.y1.includes("value") ? "Value in $": this.yAxisValues.y1.includes("price")? "Price in $": "Quantity";
    let labels:string[] = [], values:any[] = [];
    for(let i=0; i<data.length; i++) {
      labels.push(data[i][analysisType]);
      values.push(data[i][axis1Type]);
    }

    const barChartVar = new Chart(barChart.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `${barLabel} (in ${this.getUnit(barLabel)})`,
          data: values,
          backgroundColor: ["#4cbfa6"],
          borderColor: ["#4cbfa6"],
          maxBarThickness: 40,
          borderWidth: 1
        }]
      },
      options: {
        scales: {y: {
          beginAtZero: true, 
          grid: {display: false},
          ticks: {
            font: {size: this.isPreviewOpen ? 14: 17}, 
            callback: (value:any) => ["Price","Value"].includes(barLabel) ? `${value/1000000}` : `${value/1000}`, 
            color: "black"
          }, title: {display: true, text: barLabel, font:{size: this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black"}
        }, x: {
          grid: {display: false},
          ticks: {callback: (index:number) => (labels[index]).length>15 ? (labels[index]).slice(0, 15)+"...": labels[index]},
          title: {
            display: true, font:{size:this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black",
            text: this.getChartLabelName(analysisType)
          }
        }},
        animation: {duration: 1000, easing: "easeInOutQuad"},
        plugins: {legend: {position: "top", labels: {font: {size: 14}}}},
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    if(!this.isPreviewOpen) this.allChartsVarList.push(barChartVar);
    else {this.previewChartVar = barChartVar; }
  }

  generateLineChart(lineData:any) {
    const {id, analysisType, graphType, dataRange, graphTitle, axis1Type, data} = lineData;
    const lineChart = document.getElementById(id) as HTMLCanvasElement;
    const lineLabel = this.yAxisValues.y1.includes("value") ? "Value in $": this.yAxisValues.y1.includes("price")? "Price in $": "Quantity";
    let labels:string[] = [], values:any[] = [];
    for(let i=0; i<data.length; i++) {
      labels.push(data[i][analysisType]);
      values.push(data[i][axis1Type]);
    }


    const lineChartVar = new Chart(lineChart.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${lineLabel} (in ${this.getUnit(lineLabel)})`,
          data: values,
          fill: false,
          yAxisID: 'y',
          backgroundColor: ["#4cbfa6"],
          borderColor: ["#4cbfa6"],
          borderWidth: 1,
          pointRadius: 5,
          pointBorderColor: "#fff",
          pointBackgroundColor: "#4cbfa6",
          tension: 0
        }]        
      },
      options: {
        animation: {duration: 1000, easing: "easeInOutQuad"},
        responsive: true,
        plugins: {legend: {position: "top", labels: {font: {size: 14}}}},
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {display: false},
            ticks: {
              font: {size: this.isPreviewOpen ? 14: 17}, color: "black",
              callback: (index:number) => (labels[index]).length>15 ? (labels[index]).slice(0, 15)+"...": labels[index]
            }, 
            title: {
              display: true, font:{size:this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black",
              text: this.getChartLabelName(analysisType)
            }
          },
          y: {
            grid: {display: true}, 
            ticks: {
              font: {size: this.isPreviewOpen ? 14: 17}, color: "black",
              callback: (value:any) => ["Price","Value"].includes(lineLabel) ? `${value/1000000}` : `${value/1000}`
            }, 
            title: {display: true, text: lineLabel, font:{size: this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black"}},          
        }
      }
    });

    if(!this.isPreviewOpen) this.allChartsVarList.push(lineChartVar);
    else {this.previewChartVar = lineChartVar; }
  }

  generateRadarChart(radarData:any) {
    const {id, analysisType, graphType, dataRange, graphTitle, axis1Type, data} = radarData;
    const radarChart = document.getElementById(id) as HTMLCanvasElement;
    const radarLabel = this.yAxisValues.y1.includes("value") ? "Value in $": this.yAxisValues.y1.includes("price")? "Price in $": "Quantity";
    let labels:string[] = [], values:any[] = [];
    for(let i=0; i<data.length; i++) {
      labels.push(data[i][analysisType]);
      values.push(data[i][axis1Type]);
    }

    const radarChartVar = new Chart(radarChart.getContext('2d'), {
      type: "radar",
      data: {
        labels: labels,
        datasets: [{
          label: `${radarLabel} (in ${this.getUnit(radarLabel)})`,
          data: values,
          fill: true,
          backgroundColor: "#63ffdc33",
          borderColor: "#4cbfa6",
          pointBackgroundColor: "#4cbfa6",
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: "#4cbfa6"        
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {duration: 1000, easing: "easeInOutQuad"},
        scales: {r: {
          ticks: {
            font: {size: 14},
            callback: (value:any) => ["Price","Value"].includes(radarLabel) ? `${value/1000000}` : `${value/1000}`
          },
          pointLabels: {font: {size: 14}}
        },
      },
        plugins: {
          legend: {
            title: {display: true, font: {size: 15}},
            position: this.isPreviewOpen ? "bottom": "right",            
          },
        },
      }
    });
    if(!this.isPreviewOpen) this.allChartsVarList.push(radarChartVar);
    else {this.previewChartVar = radarChartVar; }
  }

  generateMixedChart(mixedData:any) {
    const {id, analysisType, chartType1, chartType2, axis2Type, axis1Type, data} = mixedData;
    const mixedChart = document.getElementById(id) as HTMLCanvasElement;    
    const mixedLabel = this.yAxisValues.y1.includes("value") ? "Value in $": this.yAxisValues.y1.includes("price")? "Price in $": "Quantity";
    const mixedLabel2 = this.yAxisValues.y2.includes("value") ? "Value in $": this.yAxisValues.y2.includes("price")? "Price in $": "Quantity";
    let labels:string[] = [], values = {data1: [], data2: []};
    for(let i=0; i<data.length; i++) {
      labels.push(data[i][analysisType]);
      values.data1.push(Number(data[i][axis1Type]));
      values.data2.push(Number(data[i][axis2Type]));
    }


    const mixedChartVar = new Chart(mixedChart.getContext('2d'), {      
      data: {
        labels: labels,
        datasets: [
          {
            type: chartType1,
            label: `${mixedLabel} (in ${this.getUnit(mixedLabel)})`,
            yAxisID: 'y1',
            data: values.data1,
            borderWidth: 1,
            pointRadius: 5,
            maxBarThickness: 40,
            backgroundColor: "#FFBF00",
            borderColor: "#FFBF00",
            pointBorderColor: "transparent",
            pointBackgroundColor: '#FFBF00',
          },
          {
            type: chartType2,
            yAxisID: 'y',
            label: `${mixedLabel2} (in ${this.getUnit(mixedLabel2)})`,
            data: values.data2,
            maxBarThickness: 40,
            backgroundColor: "#4cbfa6",
            borderColor: "#4cbfa6",
            borderWidth: 1,
            pointRadius: 5,
            pointBorderColor: "transparent",
            pointBackgroundColor: '#4cbfa6'
          },
        ]
      },
      options: {
        indexAxis: "x",
        animation: {duration: 1000, easing: "easeInOutQuad"},
        plugins: { legend: {position: "top", labels: {font: {size: 14}}} },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {display: false}, 
            ticks: {
              font: {size: this.isPreviewOpen ? 14: 17}, color: "black",
              callback: (index:number) => (labels[index]).length>15 ? (labels[index]).slice(0, 15)+"...": labels[index]
            }, 
            title: {
              display: true, font:{size:this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black",
              text: this.getChartLabelName(analysisType)
            }
          },
          y: {
            grid: {display: true}, 
            ticks: {font: {size: this.isPreviewOpen ? 14: 17}, 
            callback: (value:any) => ["Price","Value"].includes(mixedLabel2) ? `${value/1000000}` : `${value/1000}`, color: "black"}, 
            title: {display: true, text: mixedLabel2, font:{size:this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black"}
          },
          y1:{
            position: 'right', 
            grid: {display: false}, 
            ticks: {
              font: {size: this.isPreviewOpen ? 14: 17}, color: "black",
              callback: (value:any) => ["Price","Value"].includes(mixedLabel) ? `${value/1000000}` : `${value/1000}`
            },
            title: {display: true, text: mixedLabel, font:{size:this.isPreviewOpen ? 15: 18,weight:'bold'}, color: "black"}
          }
        }
      }
    });

    if(!this.isPreviewOpen) this.allChartsVarList.push(mixedChartVar);
    else {this.previewChartVar = mixedChartVar; }
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

  getUnit(type:string) {
    return ["Price","Value"].includes(type) ? "M": "K";
  }

  getChartLabelName(name:string):string {
    return ["CountryofOrigin","CountryofDestination"].includes(name) ? "Country": name=="Exp_Name"? "Supplier": name=="Imp_Name"? "Buyer": name;
  }

  saveCharts(isSavePermanent:boolean=false) {
    if(isSavePermanent) {
      const apiData = {
        Id: this.workspaceId,
        customanalysis: JSON.stringify(this.dbSavedCustomGraph)
      };
      const cacheKey = `${environment.apiurl}api/getWorkSpace?UserId=${this.authService.getUserId()}`;
      this.apiService.updateWorkspace(apiData).subscribe({
        next: (res:any) => { delete environment.apiDataCache[cacheKey]; }
      });
    }

    const stringifyGraphData = JSON.stringify(this.allCustomGraph);
    this.alertService.addUpdateSessionStorage(stringifyGraphData);
  }

  onFirstTimeClick() {
    const hiddenTag = document.getElementById("savedFileName") as HTMLInputElement;
    if(hiddenTag == null || hiddenTag.value == '') this.saveExistingFilterData(hiddenTag.value);
    else {this.isPalleteOpen =! this.isPalleteOpen;}
  }

  saveExistingFilterData(filename:string) {
    const modalRef = this.modalService.open(SaveFileComponent, { backdrop: "static", keyboard: false, windowClass: 'saveFileModalClass' });
    (<SaveFileComponent>modalRef.componentInstance).targetBy = 'side-filter';
    (<SaveFileComponent>modalRef.componentInstance).fileName = filename;
    (<SaveFileComponent>modalRef.componentInstance).saveTitle = `You have to save first, before you use custom analysis.`;
    const eventRef = (<SaveFileComponent>modalRef.componentInstance).saveCallBack.subscribe(res => {      
      this.alertService.saveInputValue(res?.fileName)
      this.eventService.saveModalEvent.emit(res);
      eventRef.unsubscribe();
      this.isPalleteOpen =! this.isPalleteOpen;
    });
  }

  onRemoveItem(chartId:string) {
    const modalRef = this.modalService.open(ConfirmationComponent, { windowClass: 'confirmModalClass' });
    (<ConfirmationComponent>modalRef.componentInstance).confirmationMsg = "Are you sure to delete this chart for permanently?";
    (<ConfirmationComponent>modalRef.componentInstance).deleteType = "customAnalysis";
    (<ConfirmationComponent>modalRef.componentInstance).callBack.subscribe({
      next: () => {
        this.dbSavedCustomGraph = this.dbSavedCustomGraph.filter((item:any) => item?.id != chartId);
        this.allCustomGraph = JSON.parse(JSON.stringify(this.dbSavedCustomGraph));
        this.saveCharts(true);
        this.isLoading = this.dbSavedCustomGraph.length>0;
        this.updateGraphOnEvent(this.dbSavedCustomGraph);
        setTimeout(() => { this.startAttachingAllGraphs(); }, 1500);
      }
    });
  }


  graphFormValidation():boolean {
    let errorCounter = 0;
    this.errorFlags = [0, 0, 0, 0, 0, 0, 0, 0];

    if(this.selectedAnalysis == "") { this.errorFlags[1] = 1; errorCounter++; } 
    if(this.yAxisValues.y1 == "") { this.errorFlags[2] = 1; errorCounter++; }

    if(this.mainSelectedChart == "") { this.errorFlags[0] = 1; errorCounter++; } 
    else if(this.mainSelectedChart=="mixed") {
      if(this.yAxisValues.y2 == "") { this.errorFlags[3] = 1; errorCounter++; }
      if(this.mixedCharts.type1 == "") { this.errorFlags[4] = 1; errorCounter++; }
      if(this.mixedCharts.type2 == "") { this.errorFlags[5] = 1; errorCounter++; }
    }

    if(this.dataRange == 0) { this.errorFlags[6] = 1; errorCounter++; }
    if(this.graphHead == "") { this.errorFlags[7] = 1; errorCounter++; }

    return errorCounter==0;
  }
}





