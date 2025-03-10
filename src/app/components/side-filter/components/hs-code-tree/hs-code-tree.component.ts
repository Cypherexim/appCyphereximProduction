import { Component, OnInit, Input, Output, OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SortHsCodePipe } from 'src/app/common/Pipes/sort-hs-code.pipe';
import { FilterNames } from 'src/app/models/others';
import { AlertifyService } from 'src/app/services/alertify.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-hs-code-tree',
  templateUrl: './hs-code-tree.component.html',
  styleUrls: ['./hs-code-tree.component.css']
})
export class HsCodeTreeComponent implements OnInit, OnDestroy {
  constructor(
    private eventService: EventemittersService,
    private alertService: AlertifyService
  ) { }

  @Input() filterName:string = '';
  hsCodesObj:any = {};
  hsCodesSumObj:any = {};
  filterNames:FilterNames = new FilterNames();
  selectedHsCodes:string[] = [];
  filterCache:any = {};
  currentCountry:string = "";
  eventSubscription:Subscription;
  eventSubscription2:Subscription;
  eventSubscription3:Subscription;
  sortHsCodePipe:SortHsCodePipe = new SortHsCodePipe();
  convertor:Function = this.alertService.valueInBillion;

  ngOnInit(): void {
    this.applyFromAnalysisData();
    this.eventSubscription = this.eventService.passFilterDataEvent.subscribe((res:any) => {
      if(Object.keys(res).length>0 && res?.data.length > 0) {
        const {sortedHsCodes, sortedHsCodesSum} = this.sortHsCodePipe.transform(res?.data);
        this.hsCodesObj = sortedHsCodes;
        this.hsCodesSumObj = sortedHsCodesSum;

        if(res['filterCache']!=undefined && res['filterCache'][this.filterNames.HsCode.key]!=undefined) {
          this.filterCache[this.filterNames.HsCode.key] = res['filterCache'][this.filterNames.HsCode.key];
        } else { this.filterCache = {}; }
      }
    });
    this.getCurrentCountry();
  }

  ngOnDestroy(): void {
    this.eventService.passFilterDataEvent.next({});
    this.eventSubscription.unsubscribe();
    this.eventSubscription3.unsubscribe();
  }

  onClickCheckbox(e:any, type:string) {
    const inputTag = e.target;
    
    if(type != '8digit') {
      const checkedStatus = e.target.checked;
      // const checkboxArr = inputTag.parentElement.parentElement.nextElementSibling.firstChild.querySelectorAll('li input[type="checkbox"]');
      
      // for(let i=0; i<checkboxArr.length; i++) {
      //   if(checkboxArr[i].value.length==8){
      //     if(checkedStatus) {
      //       if(!this.selectedHsCodes.includes(checkboxArr[i].value)) this.selectedHsCodes.push(checkboxArr[i].value);
      //     } else this.selectedHsCodes.splice(this.selectedHsCodes.indexOf(checkboxArr[i].value), 1);
      //   }

      //   checkboxArr[i].checked = checkedStatus;
      // }
      if(checkedStatus) this.selectedHsCodes.push(inputTag.value);
      else this.selectedHsCodes.splice(this.selectedHsCodes.indexOf(inputTag.value), 1);
    } else {
      if(!this.selectedHsCodes.includes(inputTag.value)) this.selectedHsCodes.push(inputTag.value);
      else this.selectedHsCodes.splice(this.selectedHsCodes.indexOf(inputTag.value), 1);
    }
  }

  getCurrentCountry() {
    this.eventSubscription2 = this.eventService.currentCountry.subscribe({
      next: (res:any) => {this.currentCountry = ["", "India"].includes(res?.country)?"INDIA":"";}, 
      error: (err:any) => console.log("Error:", err)
    });
  }

  onClickApply(type) {
    if(type == 'clear') {
      this.selectedHsCodes.forEach((item, index) => {
        const checkboxTag = document.getElementById(`${this.filterNames.HsCode.key}_${item}`) as HTMLInputElement;
        checkboxTag.checked = false;
      
        if(this.selectedHsCodes.length == index+1) {
          const pendingChexes:any = document.getElementById("nested-checkboxes").querySelectorAll("input[type='checkbox']:checked");
          for(let i=0; i<pendingChexes.length; i++) {
            pendingChexes[i].checked = false;
          }
          this.selectedHsCodes = [];
        }
      });
    }
    
    this.eventService.applyFilterEvent.emit({
      filters: this.selectedHsCodes, 
      key: this.filterNames.HsCode.key
    });
  }

  getCheckSignal(val) {
    if(Object.keys(this.filterCache).length>0) {
      return (this.filterCache[this.filterNames.HsCode.key]).includes(val);
    } else return false;
  }

  removeItemFromBox(val:string) {
    const inputId = this.filterNames.HsCode.key+"_"+val;
    const inputTag = document.getElementById(inputId) as HTMLInputElement;
    inputTag.checked = false;
    this.selectedHsCodes.splice(this.selectedHsCodes.indexOf(val), 1); 
  }

  onClickOption() {
  }

  applyFromAnalysisData() {
    this.eventSubscription3 = this.eventService.applyFromAnalysisData.subscribe({
      next: (res:any) => {
        if(this.filterName == res.name) {
          const modifyItem = {...res.selectedItem};

          const checkboxTag = document.getElementById(res.selectedItem.id) as HTMLInputElement;
          if(checkboxTag) checkboxTag.checked = true;

          if(this.selectedHsCodes.indexOf(modifyItem.value)==-1) {
            this.selectedHsCodes.push(modifyItem.value);
            setTimeout(() => this.onClickApply("apply"), 500);
          }
        }
      }, error: (err:any) => {console.log(err)}
    });
  }
}

