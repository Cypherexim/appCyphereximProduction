import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { FilterDataListComponent } from '../../modals/filter-data-list/filter-data-list.component';
import { SaveFileComponent } from '../../modals/save-file/save-file.component';
import { EllipsisPipe } from 'src/app/common/Pipes/ellipsis.pipe';
import { AlertifyService } from 'src/app/services/alertify.service';

@Component({
  selector: 'app-dropdown-box',
  templateUrl: './dropdown-box.component.html',
  styleUrls: ['./dropdown-box.component.css']
})
export class DropdownBoxComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private modalService: NgbModal, 
    private alertService: AlertifyService,
    private ellipsePipe: EllipsisPipe,
    public eventService: EventemittersService
  ) { }

  currentModalType:string = '';
  exceptionalSideFilter:string[] = ["Supplier", "Buyer", "Country"];
  copyFilterOptions:any[] = [];
  selectedItem:any[] = [];
  eventSubscription:Subscription;
  eventSubscription2:Subscription;
  eventSubscription3:Subscription;
  currentCountry:string = "";
  @Input() filterOptions:any[] = [];
  @Input() filterName:any = {};
  @Output() onAskForMore:EventEmitter<string> = new EventEmitter();
  convertor:Function = this.alertService.valueInBillion;

  ngOnChanges(changes: SimpleChanges): void {
    if(this.filterOptions) {
      if(this.selectedItem.length>0) {
        //sometimes if more than one options are choosen but results are not given based on selected options, and
        //shows exact result but un-preselected side options. Becoz this.selectedItem has all given selected options
        //but this.filterOptions doesn't have such options as it gets options based on given table data
        this.copyFilterOptions = [];
        
        for(let item of this.selectedItem) this.copyFilterOptions.push(item['value']);
      } else { 
        this.copyFilterOptions = this.filterName.name == "Month" //except month each sidefilter has to be sorted
                ? [...this.filterOptions] 
                : [...(this.filterOptions).sort()];
      }
  
      this.manageSideFilterOptions();
    }
  }

  ngOnInit(): void {
    this.getCurrentCountry();
    this.applyFromAnalysisData();
    //this event help to provide last selected filter option to sidefilter as soon as any 
    //workspace record is called and that record also has the selected side filter options
    if(this.eventSubscription) this.eventSubscription.unsubscribe();

    this.eventSubscription = this.eventService.filterCacheMoveEvent.subscribe(res => {    
      if(res.hasOwnProperty(this.filterName.key) && res[this.filterName.key].length>0) {
        const dataArr = res[this.filterName.key];
        for(let i=0; i < dataArr.length; i++) {
          const checkId = `${this.replaceSpace(this.filterName?.name)}_${this.replaceSpace(dataArr[i])}`;
          const dataObj = { id: checkId, value: dataArr[i] };
          if(this.selectedItem.filter(item => item["id"] == checkId).length == 0) {
            this.selectedItem.push(dataObj);
          }

          this.copyFilterOptions.map((item, index) => {
            if(index < 10) {
              if(item["name"] == dataArr[i]) item["isChecked"] = true;
            }
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.eventSubscription2.unsubscribe();
    this.eventSubscription3.unsubscribe();
  }

  getCurrentCountry() {
    this.eventSubscription2 = this.eventService.currentCountry.subscribe({
      next: (res:any) => {this.currentCountry = ["", "India"].includes(res?.country)?"INDIA":"";}, 
      error: (err:any) => console.log("Error:", err)
    });
  }


  showMoreOptions(type:string) {
    const hiddenTag = document.getElementById("savedFileName") as HTMLInputElement;
    if(hiddenTag == null || hiddenTag.value == '') this.saveExistingFilterData(hiddenTag.value);
    else this.showMoreFilterOptions();
  }

  saveExistingFilterData(filename:string) {
    const modalRef = this.modalService.open(SaveFileComponent, { backdrop: "static", keyboard: false, windowClass: 'saveFileModalClass' });
    (<SaveFileComponent>modalRef.componentInstance).targetBy = 'side-filter';
    (<SaveFileComponent>modalRef.componentInstance).fileName = filename;
    (<SaveFileComponent>modalRef.componentInstance).saveTitle = `You have to save first, before you explore more options.`;
    const eventRef = (<SaveFileComponent>modalRef.componentInstance).saveCallBack.subscribe(res => {
      this.alertService.saveInputValue(res?.fileName);
      this.eventService.saveModalEvent.emit(res);
      eventRef.unsubscribe();
      this.showMoreFilterOptions();
    });
  }

  showMoreFilterOptions() {
    const modalRef = this.modalService.open(FilterDataListComponent, { backdrop: "static", keyboard: false, windowClass: 'locatorModalClass' });  
    (<FilterDataListComponent>modalRef.componentInstance).filterNameKey = this.filterName;//?.name.toLowerCase();
    (<FilterDataListComponent>modalRef.componentInstance).alreadySelectedItems = this.selectedItem;
    const eventRef = (<FilterDataListComponent>modalRef.componentInstance).emitSelectedData.subscribe(res => {
      this.selectedItem = res;
      this.manageSideFilterOptions();
      eventRef.unsubscribe();
    });
  }

  onSelectItem(e:MouseEvent|any, value:any, filterLable:string) {
    const CheckBoxId = `${filterLable.replace(new RegExp(' ', 'g'), '_').toLowerCase()}_${(this.getSideFilterValue(value, false)+'').replace(new RegExp(' ', 'g'), '_').toLowerCase()}`;
    if(e.target.checked) this.addItemToBox(value, CheckBoxId);
    else this.removeItemFromBox(CheckBoxId);
  }

  addItemToBox(value, id){ this.selectedItem.push({id, value}); }

  removeItemFromBox(id:string){
    const checkboxTag = document.getElementById(id) as HTMLInputElement;
    if(checkboxTag != null) checkboxTag.checked = false;
    const tempArr = this.selectedItem.filter(item => item?.id != id);
    this.selectedItem = tempArr;
  }


  //on applying filter
  onFilterApply() {
    let itemNames:any = [];
    this.selectedItem.forEach((item, index) => {
      const isValueNotObj = typeof item?.value == "string" || typeof item?.value == "number"; 
      itemNames.push(isValueNotObj ? `${item?.value}` : `${item?.value[this.filterName.key]}`);

      if(this.selectedItem.length == index+1) {        
        this.eventService.applyFilterEvent.emit({filters: itemNames, key: this.filterName?.key});
      }
    });

    if(this.selectedItem.length == 0) this.eventService.applyFilterEvent.emit({filters: [], key: this.filterName?.key});
  }

  //on applying filter clear
  onFilterClear() {
    this.selectedItem.forEach((item, index) => {
      const checkboxTag = document.getElementById(item?.id) as HTMLInputElement;
      if(checkboxTag) checkboxTag.checked = false;

      if(this.selectedItem.length == index+1) {
        this.selectedItem = [];
        this.eventService.applyFilterEvent.emit({filters: [], key: this.filterName?.key});
      }
    });
  }


  //to make the checkboxes checked if it was checked before
  manageSideFilterOptions() {
    const tempArr = [];

    if(this.copyFilterOptions.length > 0) {
      const optionLen = this.copyFilterOptions.length>=10 ? 10: this.copyFilterOptions.length;

      for(let i=0; i<this.copyFilterOptions.length; i++) {
        if(this.selectedItem.length > 0) {
          if(i<10) {
            //if copyfilter is given by workspace
            if(!this.copyFilterOptions[i].hasOwnProperty('isChecked')) {
              this.copyFilterOptions[i] = {name: this.copyFilterOptions[i], isChecked: true}
            }

            for(let j=0; j<this.selectedItem.length; j++) {
              if(this.selectedItem[j].value === this.getSideFilterValue(this.copyFilterOptions[i].name, false)) {
                this.copyFilterOptions[i].isChecked = true;
                break;
              }
  
              if(j == this.selectedItem.length-1) {
                const idSubName = this.selectedItem[j].id;//(this.selectedItem[j].id).split('-')[0];
                
                const checkBoxTag = document.getElementById(idSubName) as   HTMLInputElement;
                if(checkBoxTag) checkBoxTag.checked = false;
                this.copyFilterOptions[i].isChecked = false;
              }
            }
          }
        } else {
          let tempObj = {};

          try {
            if(!this.copyFilterOptions[i].hasOwnProperty('isChecked')){
              tempObj = {name: this.copyFilterOptions[i], isChecked: false};
            } else tempObj = {name: this.copyFilterOptions[i].name, isChecked: false};
  
            tempArr.push(tempObj);
              
            if(i == optionLen-1) {
              const tempArr2 = [...this.copyFilterOptions];
              tempArr2.splice(0, optionLen);
              this.copyFilterOptions = [...tempArr, ...tempArr2];            
              break;
            }  
          } catch (error) { //in case of value null is given whether it is in end of array or not 
            console.log(error);
            
            if(i == optionLen-1) {
              const tempArr2 = [...this.copyFilterOptions];
              tempArr2.splice(0, optionLen);
              this.copyFilterOptions = [...tempArr, ...tempArr2];            
              break;
            } 
          }
        }
      }
    }
  }

  replaceSpace(name):string {
    if(typeof name == "string") {
      return (name+'').replace(new RegExp(' ', 'g'), '_').toLowerCase();
    } else {return ((name[this.filterName.key])+'').replace(new RegExp(' ', 'g'), '_').toLowerCase();}
  }

  getSideFilterValue(name:any, shouldBeLower:boolean=true) {
    if(typeof name != "string" && typeof name != "number") {
      const valueName = ((name[this.filterName.key])+'');
      return shouldBeLower ? valueName.replace(new RegExp(' ', 'g'), '_').toLowerCase() : valueName;
    } return name;
  }
  

  applyFromAnalysisData() {
    this.eventSubscription3 = this.eventService.applyFromAnalysisData.subscribe({
      next: (res:any) => {
        if(this.filterName.name == res.name) {
          const modifyItem = {...res.selectedItem};

          for(let i=0; i<this.copyFilterOptions.length; i++) {
            if((this.copyFilterOptions[i]).hasOwnProperty("isChecked") && this.copyFilterOptions[i]["name"][res.actualKey] == res.selectedItem["value"]) {
              modifyItem["value"] = this.copyFilterOptions[i]["name"][res.actualKey];
              break;
            } else if(this.copyFilterOptions[i]["name"][res.actualKey] == res.selectedItem["value"]) {
              modifyItem["value"] = this.copyFilterOptions[i]["name"][res.actualKey];
              break;
            }
          }

          const checkboxTag = document.getElementById(res.selectedItem.id) as HTMLInputElement;
          if(checkboxTag) checkboxTag.checked = true;

          if(this.selectedItem.length>0) {
            const isValAlreadyExist = this.selectedItem.some(item => item["value"][res.actualKey]==modifyItem["value"][res.actualKey]);
            if(!isValAlreadyExist) {
              this.selectedItem.push(modifyItem);
              setTimeout(() => this.onFilterApply(), 500);
            }
          } else {
            this.selectedItem.push(modifyItem);
            setTimeout(() => this.onFilterApply(), 500);
          }
        }
      }, error: (err:any) => {console.log(err)}
    });
  }
}
