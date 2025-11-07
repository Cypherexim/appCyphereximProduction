import { Subscription } from 'rxjs';
import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { CompanyProfileObject, Utility } from 'src/app/models/others';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { PivotPipe } from 'src/app/common/Pipes/pivot.pipe';
import { CountryHeads } from 'src/app/models/country';

import * as Highcharts from "highcharts/highmaps";
import * as worldMap from "@highcharts/map-collection/custom/world-highres.geo.json";
import { ApiMsgRes, CompanyFetchBody, PivotType } from 'src/app/models/api.types';
import { AlertifyService } from 'src/app/services/alertify.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-company-profile',
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.css']
})
export class CompanyProfileComponent implements OnInit, OnDestroy {
  pivotPipe: PivotPipe = new PivotPipe();
  selectedDate:string = "";
  companyName:string = "";
  countryType:string = "";
  mapHighcharts:any;
  page:number = 1;
  collectionSize:number = 0;
  currentListTab:string = "all";
  countryData:[string, number][] = [];
  isCompanySelected:boolean = false;
  isTableShow:boolean = false;
  tableColNames:CountryHeads = new CountryHeads();
  searchInp:string = "";
  isCompanyFromSameCountry:boolean = false;
  countryObj:any = {};
  counterEvenObj:any = {};
  currentTab:string = "export";
  currentKey:string = "";
  isLoading:boolean = false;
  subHeads2:string[] = ["hs codes", "countries", "quantity", "shipments", "contacts"];//"buyers", "suppliers"
  currencyConvertor:Function = this.alertService.valueInBillion;

  socialLinks = {web: "", google: "", linkedIn: ""};
  companyInfoPoints:any[] = [
    {icon: "phone", data: "N/A"},
    {icon: "envelope", data: "N/A"},
    {icon: "location-dot", data: "N/A"},
    {icon: "building", data: "N/A"},
    {icon: "circle-info", data: "N/A"}
  ];
  employeeCounting = {all: 0, decisionMakers: 0, others: 0};
  isEmployeeOpen:boolean = false;
  linkedInEmployees:any[] = [];
  copyLinkedInEmployees:any[] = [];

  tableName:string = "";
  isAllShipmentShow:boolean = false;
  isPivotExpand:boolean = false;
  isPivotSorted:boolean = false;
  pivotTable:any = {};
  pivotTableKeys:string[] = [];
  pivotLoading:boolean = false;
  companyAllShipments:any[] = [];
  currentTableData:any[] = [];
  shipmentTableName:string = "";
  currentTableHeads:string[] = [];
  
  profileApiObj:any = {};

  currentInfoId:string = "";

  apiSubscription1:Subscription;
  eventSubscription1:Subscription;

  companyData:CompanyProfileObject = new CompanyProfileObject();

  constructor(
    private eventService: EventemittersService,
    private apiServcie: ApiServiceService,
    public ellipsePipe: EllipsisPipe,
    private alertService: AlertifyService,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.reloadWorldMap();
    this.getCurrentCountryData();
    this.searchCompanyDetails();
  }

  ngOnDestroy(): void {
    this.eventSubscription1.unsubscribe();
    this.apiSubscription1.unsubscribe();
    this.mapHighcharts.destroy();
    this.mapHighcharts = undefined;
  }

  getEllipsedLink(link:string, limit:number):string {
    return this.ellipsePipe.transform(link, limit);
  }

  resetProfile() {
    this.companyAllShipments = [];
    this.companyData = new CompanyProfileObject();
    this.companyInfoPoints.forEach(item => item["data"] = "N/A");
  }

  switchTab(event:MouseEvent) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
    this.resetProfile();
    this.isLoading = true;
    this.currentTab = isChecked ? "import": "export";
    this.subHeads2.shift();
    this.subHeads2 = [this.isCompanyFromSameCountry 
      ? this.currentTab=="import"?"suppliers":"buyers" 
      : this.currentTab=="import"?"buyers":"suppliers", ...this.subHeads2];
    this.getRequiredCounts();
  }

  showCompanyDetail(name:string) {
    this.companyName = name;
    this.isCompanySelected = true;
  }

  getRequiredCounts(offset:number = 0) {
    const {country, companyDirection} = this.countryObj;  
    const apiObj:CompanyFetchBody = {
      countryname: country===""?"India":country,
      companyname: this.searchInp.toUpperCase(),
      direction: this.currentTab,
      date: this.selectedDate,
      countryType: this.countryObj?.type,
      sameCompanyCountry: this.isCompanyFromSameCountry,
      offset
    };

    this.getSelectedCompanyData(apiObj);
  }

  async getSelectedCompanyData(body:CompanyFetchBody) {
    try {
      const apiKey = `${environment.apiurl}api/getCompanyprofile?company=${body.companyname}&direction=${body.direction}&date=${body.date}`;

      if(!environment.apiDataCache.hasOwnProperty(apiKey)) {
        this.apiSubscription1 = this.apiServcie.getCompanyProfileCounts(body).subscribe({
          next: async(res:any) => {
            if(!res?.error) {
              environment.apiDataCache[apiKey] = res?.results;
              const countryKey = this.isCompanyFromSameCountry
                      ? this.currentTab=="import" ? "CountryofOrigin": "CountryofDestination"
                      : this.currentTab=="import" ? "CountryofDestination": "CountryofOrigin";
              this.companyAllShipments = this.isCompanyFromSameCountry ? res?.results : await this.addingOtherCountryCol(res?.results, body.countryname, countryKey);            
              this.searchCompanyLinkedIn(body?.companyname, res?.results);
            } else { this.isLoading = false; }
          }, error: (err:any) => { this.isLoading = false; }
        });
      } else {
        const data = environment.apiDataCache[apiKey];
        const countryKey = this.isCompanyFromSameCountry
              ? this.currentTab=="import" ? "CountryofOrigin": "CountryofDestination"
              : this.currentTab=="import" ? "CountryofDestination": "CountryofOrigin";
        this.companyAllShipments = this.isCompanyFromSameCountry ? data : await this.addingOtherCountryCol(data, body.countryname, countryKey);            
        this.searchCompanyLinkedIn(body?.companyname, data);
      }
    } catch (error) {console.log("Catch Error:",error);}
  }
  
  searchCompanyLinkedIn(companyName:string, arrData:any[]) {
    const cacheApiKey = `${environment.apiurl}api/getLinkedInCompanies?company=${companyName}`;

    if(environment.apiDataCache.hasOwnProperty(cacheApiKey)) {
      const res:ApiMsgRes = environment.apiDataCache[cacheApiKey];
      this.furtherLinkedInCompanyProcessAfterCallingAPI(res, arrData);
    } else {
      this.apiServcie.getLinkedInCompanies(companyName).subscribe({
        next: (res:ApiMsgRes) => {
          environment.apiDataCache[cacheApiKey] = res;
          this.furtherLinkedInCompanyProcessAfterCallingAPI(res, arrData);
        }, error: (err:ApiMsgRes) => console.log(err.message)
      });
    }
  }

  furtherLinkedInCompanyProcessAfterCallingAPI(res:ApiMsgRes, arrData:any[]) {
    const phNum = arrData.length ? (arrData[0]["Importer_Phone"] || arrData[0]["Exp_Phone"] || "N/A"): "N/A";
    if(res.results.length>0) {
      const {
        company_name, company_aboutUs, company_website, company_size, 
        company_headquarter, company_linkedin, company_contact, 
        company_address, company_googleDirection } = res.results[0];

      this.companyName = company_name;
      this.companyInfoPoints[0]["data"] = !["N/A","#N/A", null].includes(phNum) ? `${phNum}, ${(company_contact || "")}`: (company_contact || "");
      this.companyInfoPoints[2]["data"] = company_headquarter || "N/A";
      this.companyInfoPoints[3]["data"] = company_address || "N/A";
      this.companyInfoPoints[4]["data"] = company_aboutUs || "N/A";
      
      this.socialLinks = {
        web: company_website || "",
        google: company_googleDirection || "",
        linkedIn: company_linkedin || ""
      };

      this.searchLinkedInEmployees();
    } else {
      this.companyInfoPoints[0]["data"] = phNum;
      // this.companyInfoPoints[2]["data"] = arrData.length ? (arrData[0]["Importer_City"] || arrData[0]["Exp_City"] || "N/A") : "N/A";
      // this.companyInfoPoints[3]["data"] = arrData.length ? (arrData[0]["Importer_Address"] && `${arrData[0]["Importer_Address"]}, ${arrData[0]["Importer_PIN"]}` || arrData[0]["Exp_City"] && `${arrData[0]["Exp_City"]}, ${arrData[0]["Exp_PIN"]}` || "N/A") : "N/A";
    }

    this.companyInfoPoints[1]["data"] = arrData.length ? (arrData[0]["Importer_Email"] || arrData[0]["Exp_Email"] || "N/A") : "N/A";
    this.setValuesOfCompany(arrData);
  }

  searchLinkedInEmployees() {
    const cacheApiKey = `${environment.apiurl}api/getLinkedInEmployees?company=${this.companyName}`;

    if(environment.apiDataCache.hasOwnProperty(cacheApiKey)) {
      const tempArr = JSON.parse(JSON.stringify(environment.apiDataCache[cacheApiKey]));
      this.linkedInEmployees = JSON.parse(JSON.stringify(tempArr));
      this.collectionSize = this.linkedInEmployees.length;
      this.copyLinkedInEmployees = (tempArr).splice(0, 5);
      this.countingTotalEmployee();
    } else {
      this.apiServcie.getLinkedInEmployees(this.companyName).subscribe({
        next: (res:ApiMsgRes) => {
          if(!res.error) {
            environment.apiDataCache[cacheApiKey] = JSON.parse(JSON.stringify(res.results));
            this.linkedInEmployees = JSON.parse(JSON.stringify(res.results));
            this.collectionSize = this.linkedInEmployees.length;
            this.copyLinkedInEmployees = (res.results).splice(0, 5);
            this.countingTotalEmployee();
          }
        }, error: (err:ApiMsgRes) => console.log(err.message)
      });
    }
  }
  
  countingTotalEmployee() {
    this.employeeCounting = {all: 0, decisionMakers: 0, others: 0};
    const cacheApiKey = `${environment.apiurl}api/getLinkedInEmployees?company=${this.companyName}`;
    const tempLinkedInEmployeesList:any[] = JSON.parse(JSON.stringify(environment.apiDataCache[cacheApiKey] || []));
    this.employeeCounting.all = tempLinkedInEmployeesList.length;

    for(let i=0; i<this.employeeCounting.all; i++) {
      const designation = (<string>tempLinkedInEmployeesList[i]["designation"]).toLowerCase();
      if((designation.includes("manag") || designation.includes("direct"))) {
        this.employeeCounting.decisionMakers++;
      } else if(!(designation.includes("manag") || designation.includes("direct"))) {
        this.employeeCounting.others++;
      }
    }
  }

  setValuesOfCompany(arrData:any[]) {
    try {
      if(arrData.length>0) {
        const keys = ["HsCode", "Quantity", "ValueInUSD", "Exp_Name", "Imp_Name", "countries"];
        const countryKey = this.isCompanyFromSameCountry 
                      ? this.currentTab=="import" ? "CountryofOrigin": "CountryofDestination"
                      : this.currentTab=="import" ? "CountryofDestination": "CountryofOrigin";
        
        this.companyData.shipments = arrData.length;
    
        let tempArr = [];         
    
        for(let i=0; i<keys.length; i++) {
          if(keys[i]=="countries") { keys[i] = countryKey; }
    
          arrData.map(item => {
            if(item[keys[i]]) tempArr.push(item[keys[i]]);
            else if((keys[i]).toLowerCase().includes("country")) tempArr.push(this.countryObj.country);
          });
          const copyArr = [...tempArr];
          tempArr = [];
    
          if(!["Quantity", "ValueInUSD"].includes(keys[i])) {
            const finalArr = Array.from(new Set(copyArr));
            this.companyData[keys[i]]["dataList"] = JSON.parse(JSON.stringify(arrData));
            this.companyData[keys[i]]["count"] = finalArr.length;
          } else {
            const sum = copyArr.reduce((acc, curr) => acc + curr, 0);
            this.companyData[keys[i]] = Number((sum/1000000).toFixed(2))+" M";
          }
        }
        this.isLoading = false;

        setTimeout(() => {
          this.alertService.prepareMapData(this.companyData[countryKey]["dataList"], this.currentTab).then((res:any[]) => {
            this.countryData = res;
            this.worldMapInit();
          }).catch((err:any) => console.log(err));
        }, 500);
      } else { this.isLoading = false; }
    } catch (error) { console.log("Catch Error:", error); }
  }

  getProfileValue(key:string) {
    const keyObj = {buyers: "Imp_Name", suppliers: "Exp_Name", hscodes: "HsCode", quantity: "Quantity", value: "ValueInUSD"};

    keyObj["countries"] = this.isCompanyFromSameCountry 
                ? this.currentTab=="import" ? "CountryofOrigin" : "CountryofDestination"
                : this.currentTab=="export" ? "CountryofOrigin" : "CountryofDestination";
    key = key.replace(new RegExp(" ", "g"), "").toLowerCase();

    if(Object.keys(keyObj).includes(key)) {
      if(["quantity", "value"].includes(key)) return this.companyData[keyObj[key]];
      else return this.companyData[keyObj[key]]["count"];
    } else if(key == "contacts") {
      const cacheApiKey = `${environment.apiurl}api/getLinkedInEmployees?company=${this.companyName}`;
      const tempLinkedInEmployeesList = JSON.parse(JSON.stringify(environment.apiDataCache[cacheApiKey] || []));
      this.companyData.employees = tempLinkedInEmployeesList.length;
      return this.companyData.employees;
    } else return this.companyData[key];
  }

  getCurrentCountryData() {
    this.eventService.currentCountry.subscribe({
      next: (res:any) => {
        if(Object.keys(res).length>0) this.countryObj = res;
      }, error: (err:any) => console.log(err)
    });
  }


  searchCompanyDetails() {
    this.eventSubscription1 = this.eventService.companyProfileEvent.subscribe({
      next: (res:any) => {
        if(Object.keys(res).length>0 && res.target == "companyProfile") {
          const {direction, tabDirectionType, companyName, country, selectedDate, countryType} = res;
          this.counterEvenObj = {...res};
          this.isCompanyFromSameCountry = (direction=="import" && tabDirectionType=="buyer" || direction=="export" && tabDirectionType=="supplier") ? true: false;
          this.currentTab = direction;//this.isCompanyFromSameCountry ? direction : direction=="import" ? "export" : "import";
          this.searchInp = companyName;
          this.countryType = countryType;
          this.selectedDate = selectedDate;
          this.companyName = companyName;
          this.subHeads2 = [this.isCompanyFromSameCountry 
            ? this.currentTab=="import"?"suppliers":"buyers" 
            : this.currentTab=="import"?"buyers":"suppliers", ...this.subHeads2];
          
          this.profileApiObj = {
            countryType,
            date: selectedDate,
            countryname: country,
            direction: this.currentTab,
            companyname: this.searchInp.toUpperCase(),
            sameCompanyCountry: this.isCompanyFromSameCountry
          };
          
          // this.showCompanyDetail(companyName);
          this.getSelectedCompanyData(this.profileApiObj);
        }
      }, error: (err:any) => console.log(err)
    });
  }

  public getColName(key:string):string {
    const country:string = this.profileApiObj.countryname;
    const countryName = this.countryType==="CUSTOM" ? country[0].toUpperCase() + country.slice(1, country.length): "ANY";

    return this.tableColNames?.fetchCountryHeads(countryName)["locators"][this.currentTab][key];//this.tableColNames[countryName][this.currentTab][key];
  }

  showShipmentTable(keyType:string) {
    if(keyType == "contacts" && this.linkedInEmployees.length>0) {
      this.isEmployeeOpen = true;
      setTimeout(() => {
        const containerTag = document.getElementById("profileContainer") as HTMLDivElement;
        containerTag.scrollTo(0, containerTag.clientHeight);
      }, 250);
      return;
    }

    if(!["buyers", "suppliers", "hs codes", "countries", "shipments"].includes(keyType)) return;
    this.isTableShow = true;
    this.pivotLoading = true;
    const companyName = this.companyName.toUpperCase()
    
    setTimeout(async() => {
      if(keyType!="shipments") {

        this.currentKey = keyType;
        let keyInOrderArr:string[] = [];
    
        if(["buyers", "suppliers"].includes(keyType)) {
          keyInOrderArr = ["company", "country", "HsCode"];
          this.shipmentTableName = `${keyType.toUpperCase()} OF (${companyName})`;
        } else if(keyType == "hs codes") {
          keyInOrderArr = ["HsCode", "company", "country"];
          this.shipmentTableName = `${companyName}'s DEALING HSN CODES`;
        } else if(keyType == "countries") {
          keyInOrderArr = ["country", "HsCode", "company"];
          this.shipmentTableName = `${companyName}'s COVERING COUNTRIES`;
        } else {
          keyInOrderArr = ["country", "HsCode", "company"];
          this.shipmentTableName = `ALL SHIPMENTS`;
        }
    
        const keys:PivotType = { keysArr: keyInOrderArr, direction: this.currentTab, isSameCountryCompany: this.isCompanyFromSameCountry };
    
        this.pivotTable = await this.pivotPipe.transform(this.companyAllShipments, keys);    
        this.pivotTableKeys = Object.keys(this.pivotTable);
        this.pivotTableKeys.splice(this.pivotTableKeys.indexOf("value"), 1);
        this.pivotLoading = false;
      } else {
        this.shipmentTableName = "All SHIPMENT RECORDS";
        this.currentTableHeads = ["HsCode", "Quantity", "ValueInUSD"];
        this.currentTableHeads.unshift(this.currentTab=="import" ? "CountryofOrigin": "CountryofDestination");
        this.currentTableHeads.unshift(this.currentTab=="import" ? "Exp_Name": "Imp_Name");
        this.currentTableData = await JSON.parse(JSON.stringify(this.companyAllShipments));
        this.isAllShipmentShow = true;
        this.pivotLoading = false;
      }
    }, 1000);
  }

  toggleDetailOpen():void {
    this.isPivotExpand = !this.isPivotExpand;
    const levelOneDetailTags:NodeListOf<HTMLDetailsElement> = document.querySelectorAll(".level1") as NodeListOf<HTMLDetailsElement>;
    const levelTwoDetailTags:NodeListOf<HTMLDetailsElement> = document.querySelectorAll(".level2") as NodeListOf<HTMLDetailsElement>;

    levelOneDetailTags.forEach((item:HTMLDetailsElement) => { item.open = this.isPivotExpand; });
    levelTwoDetailTags.forEach((item:HTMLDetailsElement) => { item.open = this.isPivotExpand; });
  }

  closePivotTable() {
    this.isTableShow = false;
    this.isPivotExpand = false;
    this.isPivotSorted = false;
    this.isAllShipmentShow = false;
    this.currentTableHeads = [];
  }

  sortDataList() {
    this.isPivotSorted = !this.isPivotSorted;
    const tempPivotTableKeys = Object.keys(JSON.parse(JSON.stringify(this.pivotTable)));
    tempPivotTableKeys.splice(tempPivotTableKeys.indexOf("value"), 1);
    const tempPivotTableKeysLen = tempPivotTableKeys.length;
    
    for(let i=0; i<tempPivotTableKeysLen; i++) {
      this.pivotTableKeys = tempPivotTableKeys.sort((second:string, first:string) => {
        if(this.isPivotSorted) return this.pivotTable[second]["value"] - this.pivotTable[first]["value"];
        else return this.pivotTable[first]["value"] - this.pivotTable[second]["value"];
      });
    }
  }

  worldMapInit() {
    const labelName = this.currentTab=="import" ? "Importer" : "Exporter";

    this.mapHighcharts = Highcharts.mapChart('map-container', {
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
      title: {
        text: `${labelName} Countries Total Values`,
        align: "center",
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
        buttonOptions: { alignTo: "spacingBox" }
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
        pointFormat: `<b>${labelName} Value:</b>&nbsp;{point.value}K $`,//<br><b>Other: </b>{point.total}
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

  reloadWorldMap() {
    this.eventService.sidebarToggleEvent.subscribe({
      next: (res:any) => {
        this.mapHighcharts.destroy();
        setTimeout(() => this.worldMapInit(),250);
      },
      error: (err:any) => console.log(err)
    });
  }

  toTwoStr(value:number) {
    return value.toFixed(2);
  }


  addingOtherCountryCol(dataArr:any[], country:string, colName:string):Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const length = dataArr.length;
        const copyArr = JSON.parse(JSON.stringify(dataArr));
        
        for(let i=0; i<length; i++) copyArr[i][colName] = country;
        resolve(copyArr);        
      } catch (error) {
        reject(error);
      }
    });
  }

  infoGenerator(info:{key:string, value:string}):string {
    const splittedInfo = info.value.split(info.key=="email" ? " ": ", ");
    if(info.key == "email") {
      const splittedCompanyEmail = (<string>this.companyInfoPoints[1]["data"]).split("@");
      const isDotInBetweenName = splittedCompanyEmail[0].includes(".");
      const emailPrefixArr = splittedInfo.length > 2 ? splittedInfo.slice(1,splittedInfo.length) : splittedInfo;
      const finalEmail = `${emailPrefixArr.join(isDotInBetweenName ? ".": "").toLowerCase()}@${splittedCompanyEmail[1]}`;
      return finalEmail;
    } else {
      const phNumber = splittedInfo.length>1 ? splittedInfo[1] : splittedInfo[0];
      return phNumber.replace(/ /g, "");
    }
  }

  revealInfo(e:any, item:any, id:string) {
    this.currentInfoId = id;
    const iconTag = e.target as HTMLElement;
    const infoTag = this.el.nativeElement.querySelector("#"+id) as HTMLDivElement;// document.getElementById(id) as HTMLDivElement;
    iconTag.classList.add("d-none");

    const generatedInfo = id.includes("email") 
        ? this.infoGenerator({key: "email", value: item?.name}) 
        : this.infoGenerator({key: "phone", value: this.companyInfoPoints[0]["data"]});

    setTimeout(() => {
      this.renderer.setProperty(infoTag, "innerHTML", generatedInfo);
      iconTag.parentElement.classList.add("d-none");
      this.currentInfoId = "";
    }, 2500);
  }

  onRequest(id:string) {
    const buttonTag = document.getElementById(id) as HTMLButtonElement;

    if(buttonTag.classList.contains("updated")) return;

    buttonTag.children[0].classList.add("d-none");
    buttonTag.children[1].classList.remove("d-none");

    setTimeout(() => {
      buttonTag.children[1].classList.add("d-none");
      buttonTag.children[0].innerHTML = "Request Sent";
      buttonTag.children[0].classList.remove("d-none");
      buttonTag.classList.add("updated");
      console.log("request sent!");
    }, 1500);
  }

  onSelectListTab(tabName:string) {
    const cacheApiKey = `${environment.apiurl}api/getLinkedInEmployees?company=${this.companyName}`;
    const tempLinkedInEmployeesList = JSON.parse(JSON.stringify(environment.apiDataCache[cacheApiKey] || []));
    const listLen = tempLinkedInEmployeesList.length;
    this.currentListTab = tabName;
    this.linkedInEmployees = [];

    if(["directors", "others"].includes(tabName)) {
      for(let i=0; i<listLen; i++) {
        const designation = (<string>tempLinkedInEmployeesList[i]["designation"]).toLowerCase();
        if(tabName == "directors" && (designation.includes("manag") || designation.includes("direct"))) {
          this.linkedInEmployees.push(JSON.parse(JSON.stringify(tempLinkedInEmployeesList[i])));
        } else if(tabName == "others" && !(designation.includes("manag") || designation.includes("direct"))) {
          this.linkedInEmployees.push(JSON.parse(JSON.stringify(tempLinkedInEmployeesList[i])));
        }
      }
    } else { this.linkedInEmployees = tempLinkedInEmployeesList; }

    this.page = 1;
    this.collectionSize = this.linkedInEmployees.length;
    this.copyLinkedInEmployees = (JSON.parse(JSON.stringify(this.linkedInEmployees))).splice(0, 5);
  }

  //pagination functions
  selectPage(page: string) { this.page = Number(page); }
  formatInput(input: HTMLInputElement) { input.value = input.value.replace(/[^0-9]/g, ''); }
  onPageChange(pageNum:any) {
    const tempLinkedInEmployeesList = JSON.parse(JSON.stringify(this.linkedInEmployees));
    this.copyLinkedInEmployees = tempLinkedInEmployeesList.splice((pageNum-1)*5, 5);
  }
}

//https://www.google.com/search?q=xvy+pvt+ltd&ie=UTF-8


