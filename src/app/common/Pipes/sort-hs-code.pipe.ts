import { Pipe, PipeTransform } from '@angular/core';
import { FilterNames } from 'src/app/models/others';

@Pipe({
  name: 'sortHsCode'
})
export class SortHsCodePipe implements PipeTransform {

  filterNames:FilterNames = new FilterNames();

  transform(hsCodeArr: any[]): any {
    if(hsCodeArr == undefined || hsCodeArr.length==0) return {};

    let hs2Digit = [], hs4Digit = [], hs8Digit = [];
    const hsCodeArrLen = hsCodeArr.length; 
    for (let i = 0; i < hsCodeArrLen; i++) {

      const tariffCode = (() => {
        if(`${hsCodeArr[i]["HsCode"]}`.length <= 7) { hsCodeArr[i]["HsCode"] = `0${hsCodeArr[i]["HsCode"]}`; } 
        return hsCodeArr[i];
      })();

      hs2Digit.push(tariffCode["HsCode"].substring(0, 2));
      hs4Digit.push(tariffCode["HsCode"].substring(0, 4));
      hs8Digit.push(tariffCode);

      if (i == hsCodeArr.length - 1) {
        hs2Digit = Array.from(new Set(hs2Digit));
        hs4Digit = Array.from(new Set(hs4Digit));
        hs8Digit = Array.from(new Set(hs8Digit));
      }
    }

    const hsTypes = [2, 4];
    const sortedHsCodes = {};

    for (let i = 0; i < hsTypes.length; i++) {
      const tempHsCodeArr = hsTypes[i] == 4 ? hs4Digit : hs2Digit;
      const tempHsCodeArrLen = tempHsCodeArr.length;

      for (let j = 0; j < tempHsCodeArrLen; j++) {
        if (hsTypes[i] == 2) {
          const tempObj = {};
          const tempArr = hs4Digit.filter(item => item.substring(0, 2) == tempHsCodeArr[j]);
          tempArr.forEach(item => { tempObj[item] = [] });
          sortedHsCodes[tempHsCodeArr[j]] = tempObj;
        } else {
          const digit4Val = tempHsCodeArr[j];
          const tempArr = hs8Digit.filter(item => digit4Val == item["HsCode"].substring(0, 4));
          sortedHsCodes[digit4Val.substring(0, 2)][digit4Val.substring(0, 4)] = tempArr;
        }
      }
    }

    const sortedHsCodesSum = this.addSumOfValAndCount(sortedHsCodes);
    return {sortedHsCodes, sortedHsCodesSum};
  }

  addSumOfValAndCount(HsCodes:any) {
    const copyHsCodes = JSON.parse(JSON.stringify(HsCodes));
    const hs2DigitKeys = Object.keys(copyHsCodes);
    const hs2DigitKeysLen = hs2DigitKeys.length;

    for(let i=0; i<hs2DigitKeysLen; i++) {
      const hs4DigitKeys = Object.keys(copyHsCodes[hs2DigitKeys[i]]);
      const hs4DigitKeysLen = hs4DigitKeys.length;

      for(let j=0; j<hs4DigitKeysLen; j++) {
        const hs8DigitsArr = copyHsCodes[hs2DigitKeys[i]][hs4DigitKeys[j]];
        const totalCount = hs8DigitsArr.reduce((partialSum:any, a:any) => partialSum + Number(a["count"]), 0);
        const totalValue = hs8DigitsArr.reduce((partialSum:any, a:any) => partialSum + Number(a["valueinusd"]), 0);
        copyHsCodes[hs2DigitKeys[i]][hs4DigitKeys[j]] = {totalCount, totalValue};
      }

      const totalCount = hs4DigitKeys.reduce((partialSum:any, a:any) => partialSum + Number(copyHsCodes[hs2DigitKeys[i]][a]["totalCount"]), 0);
      const totalValue = hs4DigitKeys.reduce((partialSum:any, a:any) => partialSum + Number(copyHsCodes[hs2DigitKeys[i]][a]["totalValue"]), 0);
      copyHsCodes[hs2DigitKeys[i]]["total"] = {totalCount, totalValue};
    }

    return copyHsCodes;
  }

}
