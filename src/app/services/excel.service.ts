import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
import * as FileSaver from 'file-saver';
import { FilterNames } from '../models/others';
// import * as XLSX from 'xlsx-with-styles';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  sheetObj = {};
  sideFilterNames:FilterNames = new FilterNames();

  constructor(private datePipe: DatePipe) { }

  exportAsExcelFile(json: any[], excelFileName: string): void {
    const newJson = this.formattingJson(json);
    const worksheet:XLSX.WorkSheet = XLSX.utils.json_to_sheet(newJson);
    this.sheetObj[excelFileName] = worksheet;
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    const workbook: XLSX.WorkBook = {
      Sheets: this.sheetObj, 
      SheetNames: [excelFileName]
    };

    worksheet['!cols'] = this.getEditedColWidth(range, newJson);
    worksheet["!margins"]={left:1.0, right:1.0, top:1.0, bottom:1.0, header:0.5,footer:0.5};

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }

  formattingJson(arrData:any[]) {
    const dataObj = JSON.parse(JSON.stringify(arrData));
    const copyDataObj:any[] = JSON.parse(JSON.stringify(dataObj));
    const keysArr = Object.keys(dataObj[0]);
    const recordIdIndex = keysArr.indexOf("RecordID");
    if(recordIdIndex >= 0) keysArr.splice(recordIdIndex, 1);
  
    for(let i=0; i<copyDataObj.length; i++) {
      delete copyDataObj[i]["RecordID"];
      if((copyDataObj[i]).hasOwnProperty("Date")) {
        copyDataObj[i]["Date"] = this.datePipe.transform(copyDataObj[i]["Date"], 'yyyy-MM-dd');
      }
      //in case of analysis table download
      if((copyDataObj[i]).hasOwnProperty("quantityShare")) copyDataObj[i]["quantityShare"] = copyDataObj[i]["quantityShare"]+"%";
      if((copyDataObj[i]).hasOwnProperty("priceShare")) copyDataObj[i]["priceShare"] = copyDataObj[i]["priceShare"]+"%";
      if((copyDataObj[i]).hasOwnProperty("valueShare")) copyDataObj[i]["valueShare"] = copyDataObj[i]["valueShare"]+"%";
      
      
      for(let j=0; j<keysArr.length; j++) {
        if(typeof dataObj[i][keysArr[j]] == 'number') {
          copyDataObj[i][keysArr[j]] = `${copyDataObj[i][keysArr[j]]}`;
        }

        //to add zero to make hscode in 2, 4, 6, 8 digits        
        if(
          [
            this.sideFilterNames.Hs2Digit.key,
            this.sideFilterNames.Hs4Digit.key,
            this.sideFilterNames.Hs6Digit.key,
            this.sideFilterNames.HsCode.key
          ].includes(keysArr[j])
        ) {
            if([1,3,5,7].includes((copyDataObj[i][keysArr[j]]).length)) {
              copyDataObj[i][keysArr[j]] = `0${copyDataObj[i][keysArr[j]]}`;
            }
        }
      }

      if(i==copyDataObj.length-1) return copyDataObj;
    }
  }

  //to adjust excel sheet cell as per the longest value
  getEditedColWidth(range, data):any[] {
    const keysArr = Object.keys(data[0]); //all keys 
    const valuesArr:number[] = [];

    //this loop helps to get all column largest values
    for(let i=0; i<keysArr.length; i++) {
      const tempArr:number[] = [];
      for(let j=0; j<data.length; j++) {
        tempArr.push(`${data[j][keysArr[i]]}`.length);

        if(j == data.length-1) valuesArr.push(Math.max(...tempArr));
      }
    }

    const widthByChArr = [];

    //this loop help to create the array of workbook cell width
    for(let i = range.s.r; i <= range.e.c; i++) {
      if(keysArr[i].length > valuesArr[i]) {
        widthByChArr.push({wch: (keysArr[i].length)});
      } else {
        widthByChArr.push({wch: valuesArr[i]+1});
      }
    }
    
    return widthByChArr;
  }
}
