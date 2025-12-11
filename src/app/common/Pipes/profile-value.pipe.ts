import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';
@Pipe({
  name: 'profileValue'
})
export class ProfileValuePipe implements PipeTransform {

  transform(
    key: string,
    companyData: any,
    isCompanyFromSameCountry: boolean,
    currentTab: string,
    companyName: string
  ): any {

    console.log("key in pipe",key);
    

    const keyObj: any = { 
      buyers: 'Imp_Name',
      suppliers: 'Exp_Name',
      hscodes: 'HsCode',
      quantity: 'Quantity',
      value: 'ValueInUSD'
    };

    keyObj['countries'] = isCompanyFromSameCountry
      ? currentTab === 'import' ? 'CountryofOrigin' : 'CountryofDestination'
      : currentTab === 'export' ? 'CountryofOrigin' : 'CountryofDestination';

    key = key.replace(/ /g, '').toLowerCase();

    if (Object.keys(keyObj).includes(key)) {
      if (['quantity', 'value'].includes(key)) {
        return companyData[keyObj[key]];
      } else {
        return companyData[keyObj[key]]["count"];;
      }
    } 
    else if (key === 'contacts') {
      const cacheApiKey = `${environment.apiurl}api/getLinkedInEmployees?company=${companyName}`;
      const list = JSON.parse(JSON.stringify(environment.apiDataCache[cacheApiKey] || []));
      return list.length;
    } 
    else {
      return companyData[key] || 0;
    }
  }


}
