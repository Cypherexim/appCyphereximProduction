import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sideFilter'
})
export class SideFilterPipe implements PipeTransform {

  transform(filterCache:any, dataArr:any[]): any[] {
    const allKeys = Object.keys(filterCache);
    let filteredArr = dataArr;    

    for(let i=0; i<allKeys.length; i++) {
      //Array.from(filterCache[allKeys[i]]).filter((x: any) => Array.from(dataArr).includes(x[allKeys[i]]));
      if(allKeys[i] != 'Quantity') {
        filteredArr = filteredArr.filter(item => filterCache[allKeys[i]].filter(item1 => (`${item1}`.toLowerCase()).includes((`${item[allKeys[i]]}`).toLowerCase())).length);
      } else {
        filteredArr = filteredArr.filter(item => filterCache[allKeys[i]].filter(item1 => item[allKeys[i]] <= item1).length);
      }
      // filteredArr = filteredData.length>0 ? [...filteredData] : [...filteredArr];
      // filteredArr = [...filteredData];

      if(i == allKeys.length-1) {return filteredArr;}
    }
  }
}
// let caches = new Map<string, any>();
// return Array.from(items).filter((x: any) => Array.from(searchText).includes(x[fieldName]));
