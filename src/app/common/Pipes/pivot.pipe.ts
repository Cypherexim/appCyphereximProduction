import { Pipe, PipeTransform } from '@angular/core';
import { PivotType } from 'src/app/models/api.types';

@Pipe({
  name: 'pivot'
})
export class PivotPipe implements PipeTransform {
  transform(dataArr:any[], keysOrder:PivotType):Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const {keysArr, direction, isSameCountryCompany} = keysOrder;
        const loopLen = dataArr.length;
        const pivotStructure = {value: 0};
        const [level1, level2, level3] = [
          this.getActualDataKey(keysArr[0], direction, isSameCountryCompany),
          this.getActualDataKey(keysArr[1], direction, isSameCountryCompany),
          this.getActualDataKey(keysArr[2], direction, isSameCountryCompany)
        ];
  
        for(let i=0; i<loopLen; i++) {
          const data = dataArr[i];
          pivotStructure["value"] += Number(data["ValueInUSD"]);
          
          if(pivotStructure.hasOwnProperty(data[level1])) {
            pivotStructure[data[level1]]["value"] += Number(data["ValueInUSD"]);

            if(pivotStructure[data[level1]].hasOwnProperty(data[level2])) {
              pivotStructure[data[level1]][data[level2]]["value"] += Number(data["ValueInUSD"]);
              
              if(pivotStructure[data[level1]][data[level2]].hasOwnProperty(data[level3])) {
                pivotStructure[data[level1]][data[level2]][data[level3]] += Number(data["ValueInUSD"]);
              } else {
                pivotStructure[data[level1]][data[level2]][data[level3]] = Number(data["ValueInUSD"]);
              }

            } else {
              pivotStructure[data[level1]][data[level2]] = {value: Number(data["ValueInUSD"])};
              pivotStructure[data[level1]][data[level2]][data[level3]] = Number(data["ValueInUSD"]);
            }
            
          } else {            
            pivotStructure[data[level1]] = {value: Number(data["ValueInUSD"])};
            pivotStructure[data[level1]][data[level2]] = {value: Number(data["ValueInUSD"])};
            pivotStructure[data[level1]][data[level2]][data[level3]] = Number(data["ValueInUSD"]);
          }          
        }     
        
        return resolve(pivotStructure);
      } catch (error) {
        return reject(error);
      }
    });
  }


  getActualDataKey(orderkey:string, direction:string, isSameCountryCompany:boolean):string {
    const countryKey = isSameCountryCompany 
            ? direction=="import" ? "CountryofOrigin" : "CountryofDestination"
            : direction=="export" ? "CountryofOrigin" : "CountryofDestination";
    const companyKey = isSameCountryCompany 
            ? direction=="import" ? "Exp_Name" : "Imp_Name"
            : direction=="export" ? "Exp_Name" : "Imp_Name";

    const keyName = orderkey=="country" ? countryKey : orderkey=="company" ? companyKey : orderkey; 
    return keyName;
  }  
}
