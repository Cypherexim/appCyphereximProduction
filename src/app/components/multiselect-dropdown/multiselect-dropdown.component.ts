import { Component, Input, OnInit, Output, EventEmitter, OnChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-multiselect-dropdown',
  templateUrl: './multiselect-dropdown.component.html',
  styleUrls: ['./multiselect-dropdown.component.css']
})
export class MultiselectDropdownComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("cdkTable", { static: true }) cdkTable!: ElementRef;
  @Input() isLoadingMore:boolean = false;
  @Input() dropDownData:any[] = [];
  @Input() dropDownOption = {key: '', value: '', enableSelectAll: false, searchPlaceholder: ''};
  @Output() onSelectVal:EventEmitter<any[]> = new EventEmitter();
  @Input() remainingVal:number = 1;
  @Input() selectionID:string = '';

  dropDownId:string = 'testing'
  isVisible:boolean = false;
  isAllChecked:boolean = false;
  isBoxOnFocus:boolean = true;
  selectedItems:any[] = [];
  transferSelectedItems:string[] = [];
  copiedDropDownList:any[] = [];
  alertCls:string = "";
  hscodeInp:string = "";
  filterInp:string = "";

  checkedIds:any[] = [];

  defaultPlaceHolder:string = '';

  eventSubscription:Subscription;

  constructor(
    private authService: AuthService,
    private eventService:EventemittersService
  ) { }

  ngOnChanges() {
    this.copiedDropDownList = [...this.dropDownData];
    this.defaultPlaceHolder = this.dropDownOption.searchPlaceholder.split(" ")[1];
  }

  ngOnInit(): void {
    this.copiedDropDownList = [...this.dropDownData];

    this.eventSubscription = this.eventService.updateMultiselectDropDownEvent.subscribe(res => {
      if(this.selectionID == res.targetFrom){
        this.selectedItems = [];
        this.checkedIds = [];
        this.isAllChecked = false;
        this.clearAllCheckboxes();

        if(!(res.updateType && res.updateType == 'clear')) {
          if(res?.items.length == 1 && res?.items[0] == 'All') {
            this.isAllChecked = true;
            this.dropDownData.forEach(item => {
              this.selectedItems.push(item[this.dropDownOption.value]);
            });
          } else {            
            for(let i=0; i<res?.items.length; i++) {
              this.selectedItems.push(res?.items[i]);

              const checkedItem = this.dropDownData.filter(item => item[this.dropDownOption.value] == res?.items[i]);
              if(checkedItem.length>0 && checkedItem[0][this.dropDownOption.key]) {
                this.checkedIds.push(checkedItem[0][this.dropDownOption.key]);
              }
              // if(i==res?.items.length-1) console.log(this.selectedItems,this.checkedIds);
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.eventSubscription.unsubscribe();
  }

  hideBelowOptions() {
    if(this.isBoxOnFocus) {
      this.isVisible = false;
      this.copiedDropDownList = [...this.dropDownData];
      this.filterInp = "";
    }
  }

  onCheckSingle(e, data) {
    if(e.target.checked) {
      if(this.dropDownOption.enableSelectAll) {
        this.selectedItems.push(data[this.dropDownOption.value]);
      } else {
        const checkboxArr:any = document.querySelectorAll('input[type="checkbox"]:checked');
        for(let elem of checkboxArr) {elem.checked = false;}

        e.target.checked = true;
        this.selectedItems = [data[this.dropDownOption.value]];
      }
      this.checkedIds.push(data[this.dropDownOption.key]);
    } else {
      this.selectedItems = this.selectedItems.filter(item => item != data[this.dropDownOption.value]);      
      this.checkedIds = this.checkedIds.filter(id => id != data[this.dropDownOption.key]);
    }

    this.onSelectVal.emit(this.selectedItems);
    this.isVisible = false;

    this.cdkTable.nativeElement.children[0].scrollTop = 0;
  }

  // fillTransferVariable(arr):string[] {
  //   this.transferSelectedItems = [];

  //   for(let i=0; i<arr.length; i++) {
  //     this.transferSelectedItems.push(arr[i][this.dropDownOption.value]);
  //   }

  //   return this.transferSelectedItems;
  // }

  onClickRemove(data) {
    const elemTag = document.getElementById(data["labelId"]) as HTMLSpanElement;
    elemTag.setAttribute('data-selected', 'no');
    
    this.selectedItems = this.selectedItems.filter(item => item != data[this.dropDownOption.value]);
    this.checkedIds = this.checkedIds.filter(id => id != data[this.dropDownOption.key]);
    const checkboxArr:any = document.querySelectorAll('input[type="checkbox"]:checked');
    for(let elem of checkboxArr) {elem.checked = false;}
    this.isVisible = false;


  }

  onCheckMultiple() {
    this.isAllChecked = !this.isAllChecked;
    this.selectedItems = [];
    this.checkedIds = [];

    if(this.isAllChecked) {
      this.dropDownData.forEach(item => {
        this.selectedItems.push(item[this.dropDownOption.value]);
        this.checkedIds.push(item[this.dropDownOption.key]);
      });
    }

    this.onSelectVal.emit(this.isAllChecked ? ['All'] : []);
  }

  onFilterSearch(type) {
    const value:string = (type=="multi" ? this.filterInp : this.hscodeInp).toLowerCase();
    
    if(value.length>0) {
      this.copiedDropDownList = this.dropDownData.filter(item => value == (type=="hscode" ? item : item[this.dropDownOption.value]).substring(0, value.length).toLowerCase());
    } else {
      this.copiedDropDownList = [...this.dropDownData];
    }

    this.scrollToBottom();
  }

  setBoxFocus = (bool) => {
    this.isBoxOnFocus = bool;
  } 

  //only for the time being util we need multiple hscodes (Add Hscode)
  onClickSingleVal(data, isAccessible=true) {
    if(!isAccessible) return;

    this.hscodeInp = "";
    
    if(this.remainingVal == 0) {
      this.selectedItems = this.selectedItems.filter(item => item != data);//[this.dropDownOption.value]
      this.selectedItems.push(data);//[this.dropDownOption.value]
    } else {
      if(this.selectedItems.length < this.remainingVal) {
        this.selectedItems = [data];//[this.dropDownOption.value]

        this.onSelectVal.emit(this.selectedItems);
        
        this.cdkTable.nativeElement.children[0].scrollTop = 0;
      } else {
        this.alertCls = "showAlert";
        setTimeout(() => {this.alertCls = ""}, 1500);
      }
    }

    this.isVisible=false;
  }
  //only for the time being util we need multiple hscodes (Remove Hscode)
  onClickRemoveVal(data, type) {
    if(type == "hscode") {
      this.selectedItems.splice(this.selectedItems.indexOf(data), 1);
      this.onSelectVal.emit(this.selectedItems);
    } else {
      // ---------->>>problem was occured here
      const currentData = this.dropDownData.filter(item => item[this.dropDownOption.value] == data);
      const checkboxTag = document.getElementById("multi_"+currentData[0][this.dropDownOption.key]) as HTMLInputElement;
      this.checkedIds = this.checkedIds.filter(item => item != currentData[0][this.dropDownOption.key]);
      this.selectedItems.splice(this.selectedItems.indexOf(currentData[0][this.dropDownOption.value]), 1);
      this.onSelectVal.emit(this.selectedItems);
      if(checkboxTag) checkboxTag.checked = false;
    }
  }


  onClickSingleOption(id, data) {
    const elemTag = document.getElementById(id) as HTMLSpanElement;
    const dataValue = elemTag.getAttribute('data-selected');
    data['labelId'] = id;

    if(dataValue == 'no') {
      if(this.selectedItems.length < this.remainingVal) {
        // this.selectedItems.push(data); //for multiple selecting values
        this.selectedItems = [data[this.dropDownOption.value]];
      }
      elemTag.setAttribute('data-selected', 'yes');
    } 
    // else {
    //   this.selectedItems = this.selectedItems.filter(item => item[this.dropDownOption.key] != data[this.dropDownOption.key]);
    //   elemTag.setAttribute('data-selected', 'no');
    // }

    this.isVisible = false;
    this.scrollToBottom();
  }

  scrollToBottom(){
    if(!this.dropDownOption.enableSelectAll) {
      const scrollDivTag = document.getElementById('scrollingbox') as HTMLDivElement;
      scrollDivTag.scroll(0, 1000);
    }
  }

  getCheckedBool(item):boolean {
    return this.checkedIds.includes(item[this.dropDownOption.key]);
  }

  clearAllCheckboxes() {
    const checkboxTags:any = document.querySelectorAll("input.multi-select[type='checkbox']:checked");
    
    for(let i=0; i<checkboxTags.length; i++) {
      checkboxTags[i].checked = false;
    }
  }

  hasHsCodeAccess(code):boolean {
    if([undefined, null].includes(code)) return;

    try {
      if(this.authService.getUserDetails()["TarrifCodeAccess"] == "All") return true;
      else {
        const hsCodeArr:string[] = (this.authService.getUserDetails()["TarrifCodeAccess"]).split(",");
        const codePrefix = code.substring(0, 2);
        if(hsCodeArr.includes(codePrefix)) return true;
        else return false;
      }
    } catch (error) {return;}
  }
}
