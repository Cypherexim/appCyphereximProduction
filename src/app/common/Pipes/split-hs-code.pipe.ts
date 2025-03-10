import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitHsCode'
})
export class SplitHsCodePipe implements PipeTransform {
  transform(hsCodeArr: any[], digit: number):any {
    return new Promise((resolve, reject) => {
      try {
        const tempArr = [];

        for(let i=0; i<hsCodeArr.length; i++) {
          if(digit == 2 || digit == 4) {
            const currentHsCode = (hsCodeArr[i]["Hscode"]).substring(0, digit);
            tempArr.push(currentHsCode);
          } else tempArr.push(hsCodeArr[i]["Hscode"]);
        }
    
        const commonHsCodes = Array.from(new Set(tempArr));
        resolve(commonHsCodes);
      } catch (error) { console.log(error); }
    });
  }

  fetchHsCodes(hsCodes:any[]):any[] {
    const arrLen = hsCodes.length;
    const hsCodeDigitArr = [];

    for(let i=0; i<arrLen; i++) {
      hsCodeDigitArr.push(hsCodes[i]["Hscode"]);
    }

    return hsCodeDigitArr;
  }
}
