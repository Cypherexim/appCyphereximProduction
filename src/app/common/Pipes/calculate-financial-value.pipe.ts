import { Pipe, PipeTransform } from '@angular/core';
import { AlertifyService } from 'src/app/services/alertify.service';

@Pipe({
  name: 'calculateFinancialValue'
})
export class CalculateFinancialValuePipe implements PipeTransform {
  constructor(
    private alertService: AlertifyService
  ) {}

  financialYearMonths:string[] = ["APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","JAN","FEB","MAR"];

  transform(data:any, type:string=""): any {
    if(type == "FY-TOTAL") {
      const response = this.getFinancialYearMonthsTotal(data);
      return response;
    } else if(type == "CURRENT-MONTH") {
      const response = this.getCurrentLastMonth(data);
      return response;
    } else if(type == "GRAND-TOTAL") {
      const response = this.getFinancialYearMonthsTotal(data);
      const grandTotal = this.alertService.valueInBillion(response[0]+response[1], true);
      return grandTotal;
    } else if(type == "MONTH-DIFFERENCE") {
      const response = this.getMonthDifferenceInPercent(data);
      return response;
    } else {
      return this.alertService.valueInBillion(data, true);
    }
  }

  private getMonthDifferenceInPercent(commodity:any) {
    try {
      const years = Object.keys(commodity).sort();
      const monthNames = Object.keys(commodity[years[years.length>2 ? 2 : 1]]);
      const focusMonth = monthNames[monthNames.length-1];
      const diffInPercent = ((commodity[years[1]][focusMonth] - commodity[years[0]][focusMonth])/commodity[years[0]][focusMonth]) * 100
      
      return diffInPercent.toFixed(2);
    } catch (error) { console.log(error); }
  }

  private getCurrentLastMonth(commodity:any):any {
    try {
      const years = Object.keys(commodity).sort();
      const monthNames = Object.keys(commodity[years[years.length>2 ? 2 : 1]]);
      const focusMonth = monthNames[monthNames.length-1];

      return [
        this.alertService.valueInBillion(commodity[years[0]][focusMonth], true), 
        this.alertService.valueInBillion(commodity[years[1]][focusMonth], true)
      ];
    } catch (error) { console.log(error); }
  }

  private getFinancialYearMonthsTotal(commodity:any):number[] {
    try {
      const years = Object.keys(commodity).sort();
      const yearLoopLen = years.length>2 ? 2: years.length;
      const totalValues = { [years[0]]: 0, [years[1]]: 0 };
  
      for(let i=0; i<yearLoopLen; i++) {
        const loopLen = i==0 ? 12
        : years.length>2 ? ((Object.keys(commodity[years[2]]).length)>=3 ? 12 : (Object.keys(commodity[years[2]]).length)+9) 
        : (Object.keys(commodity[years[1]]).length)-3;

        for(let j=0; j<loopLen; j++) {
          if(j<9) {
            totalValues[years[i]] += Number(commodity[years[i]][this.financialYearMonths[j]]);
          } else {
            totalValues[years[i]] += Number(commodity[years[i+1]][this.financialYearMonths[j]]);
          }
        }
      }
      
      return Object.values(totalValues);
    } catch (error) { console.log(error); }
  }
}
