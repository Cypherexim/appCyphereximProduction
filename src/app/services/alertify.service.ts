import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as alertify from 'alertifyjs';
import { DatePipe } from '@angular/common';
import { DownloadModelComponent } from '../components/homepage/components/download-model/download-model.component';
import { UserAlertModalComponent } from '../components/homepage/components/user-alert-modal/user-alert-modal.component';
import { ApiMsgRes } from '../models/api.types';
import { Utility } from '../models/others';

@Injectable({
  providedIn: 'root'
})
export class AlertifyService {
  staticAlertMsg:string = "Sorry, Your package doesn't seem to have this facility. To fully enjoy, please upgrade your package!";

  constructor(
    private modalService: NgbModal, 
    private datePipe: DatePipe
  ) { }

  success(message: string) {
    alertify.success(message);
    
  }
  warning(message: string) {
    alertify.warning(message);
  }
  error(message: string) {
    alertify.error(message);
  }


  //==============custom popup alerts on insufficient points or errors==============//
  showWarningAlert(msg:string) {
    const modalRef = this.modalService.open(DownloadModelComponent, { windowClass: 'alertWarningClass', centered: true });
    (<DownloadModelComponent>modalRef.componentInstance).modalType = 'credit-msg';
    (<DownloadModelComponent>modalRef.componentInstance).warningMsg = msg;
  }

  showPackageAlert(msg:string=this.staticAlertMsg) {
    const modalRef = this.modalService.open(UserAlertModalComponent, { backdrop: "static", keyboard: false, windowClass: 'alertWarningClass2', centered: true });
    (<UserAlertModalComponent>modalRef.componentInstance).alertMsg = msg;
  }

  //to get number of days
  getNumberOfDays(from, to):number {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const timeDifference = toDate.getTime() - fromDate.getTime();
    const numOfDays = timeDifference / (1000 * 60 * 60 * 24);
    return numOfDays;
  }

  getFormattedDate(isoDateStr:string):string {
    const formattedDate = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(isoDateStr));

    return formattedDate;
  }

  dateInFormat(strDate:any) {
    if(strDate == "") return "";
    const date = new Date(strDate);
    const year = date.getFullYear();
    const month = date.getMonth()+1;
    const day = date.getDate();

    const fitZero = (num:any) => {
      if(Number(num) <= 9) return "0"+num;
      else return num;
    }

    return `${year}-${fitZero(month)}-${fitZero(day)}`;
  }

  
  //to get calender dates
  getCalenderDates(range:number, latestDate) {
    let today = new Date(latestDate);
    //const currentDate =  this.dateInFormat(today);//this.datePipe.transform(today, "yyyy-MM-dd");
    const dates = {from: '', to: ''};

    if(range < 12) {
      const currentDate = new Date();
      const fromDate = new Date(today.getFullYear(), today.getMonth()-range, 1);
      // range==0 ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth()-range, 1);
      const toDate = range==0 ? new Date(latestDate) : new Date(
        today.getFullYear(), today.getMonth()-1,
        new Date(today.getFullYear(), 
        (today.getMonth()+1)-1, 0).getDate()
      );

      dates.from = this.dateInFormat(fromDate);//`${year}-${this.getMonthInFormat(month)}-01`;
      dates.to = this.dateInFormat(toDate); //currentDate
    } else {
      const latestYear = today.getFullYear();
      dates.from = `${latestYear-1}-01-01`;
      dates.to = `${latestYear-1}-12-31`//currentDate;
    }

    return dates;
  }

  async getModifiedWorkspace(dataListArr:any[]):Promise<{folderNames:string[], modifiedArr:any[]}> {
    const folderNames = [];
    const copyDataArr = [...dataListArr];
    const errorItems = [null, undefined, 'null', 'undefined'];

    for(let i=0; i<dataListArr.length; i++) {
      const isFolderNameNull = errorItems.includes(dataListArr[i]["foldername"]);
      const folderName = isFolderNameNull ? "default": dataListArr[i]["foldername"]; 

      if(isFolderNameNull) copyDataArr[i]["foldername"] = folderName;

      if(folderNames.length == 0) folderNames.push(folderName);
      else if(!folderNames.includes(folderName)) folderNames.push(folderName);
    }

    return {folderNames, modifiedArr: copyDataArr};
  }


  //service to provide table height as per screen size
  getTableHeight() {
    const currentWidth = window.screen.width;
    
    if(currentWidth == 0) {

    } 
  }

  setAsPerRes(type:string) {
    const currentWidth = window.screen.width;
    
    if(type == "sidefilter") {
      return (({
        1920: "3.6vh", 1680: "35px", 1600: "4.5vh", 1400: "35px",
        1440: "35px", 1366: "4.5vh", 1360: "30px"
      })[currentWidth] || "35px");
    } else if(type == "whatstrending") {
      return (({
        1920: ["83.5vh", "90vh"], 1680: ["83vh", "90vh"],
        1400: ["83.5vh", "90vh"], 1366: ["78vh", "87vh"],
      })[currentWidth] || ["80vh", "88vh"]);
    }
  }



  sideFilterDataFormation(response:any[]) {
    const sidefilterObj = {};
    sidefilterObj["HsCode"] = response[0]["results"];
  }

  valueInBillion(value:any, onlyForMillion:boolean=false) {
    const actualVal = Number(value);
    const getCalNum = (unit:string, pow:number):string => `${parseFloat(`${actualVal / Math.pow(10, pow)}`).toFixed(2)} ${unit}`;
    
    if(!onlyForMillion) {
      if(isNaN(Number(value))) return value;
      else{
        if(actualVal >= Math.pow(10, 12)) return getCalNum("T", 12);
        else if(actualVal >= Math.pow(10, 9)) return getCalNum("B", 9);
        else if(actualVal >= Math.pow(10, 6)) return getCalNum("M", 6);
        else return getCalNum("K", 3);
      }
    } else return getCalNum("M", 6);
  }


  saveInputValue(filename:string) {
    const hiddenTag = document.getElementById("savedFileName") as HTMLInputElement;
    hiddenTag.value = filename;
  }


  addUpdateSessionStorage(graphDataStr:string) {window.sessionStorage.setItem("custom", graphDataStr); }
  getSessionStorage() {
    const graphStr = window.sessionStorage.getItem("custom");
    return graphStr;
  }
  removeSessionStorage() {window.sessionStorage.setItem("custom", "[]");}

 
  setHighlightToDesc(prodDesc:string, prodWord:string):string {
    if(prodWord=="" || prodWord==undefined) return prodDesc;
    if(!prodDesc.toUpperCase().includes(prodWord.toUpperCase())) return prodDesc;
    
    const sentPointer = {
      first: {sent: "", pos: null},
      last: {sent: "", pos: null}
    };

    sentPointer.first.pos = prodDesc.lastIndexOf(prodWord);
    sentPointer.last.pos = sentPointer.first.pos + prodWord.length;
    sentPointer.first.sent = prodDesc.slice(0, sentPointer.first.pos);
    sentPointer.last.sent = prodDesc.slice(sentPointer.last.pos, prodDesc.length);
    
    const productWord = prodDesc.slice(sentPointer.first.pos, sentPointer.last.pos);
    const finalProdDesc = `${sentPointer.first.sent}<span class="hightlight">${productWord}</span>${sentPointer.last.sent}`;
    return finalProdDesc;
  }


  prepareMapData(dataArr:any[], currentTab:string) {
    const numInK = (val:number):string => Number(val/1000).toFixed(2);

    return new Promise((resolve, reject) => {
      const arrLen = dataArr.length;
      const countryKey = currentTab=="import" ? "CountryofOrigin": "CountryofDestination";
      const tempObj = {};
      
      for(let i=0; i<arrLen; i++) {
        const countryName = (<string>dataArr[i][countryKey]).toLowerCase();
        if(tempObj.hasOwnProperty(countryName)) { tempObj[countryName] += Number(dataArr[i]["ValueInUSD"]); }
        else { tempObj[countryName] = Number(dataArr[i]["ValueInUSD"]); }
      }
  
      const tempObjkeys = Object.keys(tempObj);
      const tempObjLen = tempObjkeys.length;
      const allCountryCode = new Utility().countries;
      const worldMapData = [];
  
      for(let j=0; j<tempObjLen; j++) {
        const codeItem = allCountryCode.filter(item => item["name"].toLowerCase() == tempObjkeys[j]);
        if(codeItem.length>0) {
          const countryValue = numInK(tempObj[codeItem[0]["name"].toLowerCase()]);
          worldMapData.push([codeItem[0]["code"].toLowerCase(), Number(countryValue)]);
        }
      }

      resolve(worldMapData);
    });
  }


  refineGlobalCountryList(resList:ApiMsgRes[]):Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const [countries, countryDates] = resList;
        const countriesArr = countries.results, countryDatesArr = countryDates.results;
        const loopLen:number = countriesArr.length, dateLen:number = countryDatesArr.length;
        const finalArr:any[] = [], countryDatesObj = {};
  
        for(let i=0; i<dateLen; i++) { 
          if(!countryDatesObj.hasOwnProperty(countryDatesArr[i]["Direction"])) {
            countryDatesObj[countryDatesArr[i]["Direction"]] = {};
          }
          countryDatesObj[countryDatesArr[i]["Direction"]][countryDatesArr[i]["CountryCode"]] = countryDatesArr[i]; 
        }
  
        for(let i=0; i<loopLen; i++) {
          let countryData = countriesArr[i];
          
          if((countryDatesObj["export"]).hasOwnProperty(countryData["Countrycode"])) {            
            const countryDataItem = {
              ...countryData,
              active: countryData["active"] && countryData["Export"],
              Direction: countryDatesObj["export"][countryData?.Countrycode]["Direction"] || "N/A",
              LatestDate: countryDatesObj["export"][countryData?.Countrycode]["LatestDate"] || "N/A",
              StartDate: countryDatesObj["export"][countryData?.Countrycode]["StartDate"] || "N/A"
            };
            
            finalArr.push(countryDataItem);
          }

          if((countryDatesObj["import"]).hasOwnProperty(countryData["Countrycode"])) {
            const countryDataItem = {
              ...countryData,
              active: countryData["active"] && countryData["Import"],
              Direction: countryDatesObj["import"][countryData?.Countrycode]["Direction"] || "N/A",
              LatestDate: countryDatesObj["import"][countryData?.Countrycode]["LatestDate"] || "N/A",
              StartDate: countryDatesObj["import"][countryData?.Countrycode]["StartDate"] || "N/A"
            };
            
            finalArr.push(countryDataItem);
          }
        }
  
        finalArr.sort((a:any, b:any) => a["CountryName"].localeCompare(b["CountryName"]));
        return resolve(finalArr); 
      } catch (error) {
        return reject(error);
      }
    });
  }

  getModifiedObj(arrayData: any[], colDir:string):Promise<any[]> {
    const modifiedArr = [];
    return new Promise((resolve, reject) => {
      if(arrayData.length == 0) resolve([]);
      else {
        const colName = Object.keys(arrayData[0]).filter((item:string) => item!="id")[0];
        for (let i = 0; i < arrayData.length; i++) {
          try {
            // const actualDirCol = Object.keys(arrayData[i])[1];
            const newObj = { id: arrayData[i]["id"] };
            newObj[colDir] = arrayData[i][colName];
            modifiedArr.push(newObj);

            if (i == arrayData.length - 1) resolve(modifiedArr);
          } catch (error) { reject([]); }
        }
      }
    });
  }

  delayer(delayTimeInSec:number):Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {resolve(true);}, delayTimeInSec);
    });
  }
}


