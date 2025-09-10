import { Component, OnInit, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, debounceTime } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { environment } from 'src/environments/environment';
/////////////countryType
@Component({
  selector: 'app-locator-modal',
  templateUrl: './locator-modal.component.html',
  styleUrls: ['./locator-modal.component.css']
})
export class LocatorModalComponent implements OnInit, AfterViewInit, OnDestroy {
  searchControl:FormControl = new FormControl();
  searchVal:string = '';
  locatorType:string = '';
  isApiProcess:boolean = false;
  isMainSelect:boolean = false;
  isSelectAllShow:boolean = false;
  locatorObj = { country: "", type: "", fromDate: "", toDate: "", countryType: "" };
  listArr:any[] = [];
  copyArr:any[] = [];
  backupLocatorData:any = {};
  isLocatorExist = ():boolean => Object.keys(this.backupLocatorData).length>0;
  isError:boolean = false;
  selectedArr:string[] = [];
  errorMsg:string = 'No Data Found';
  hasExceeded:boolean = false;

  perPageLocators:any[] = [];
  currentPageNum:number = 0;
  columnDirection:string = "";

  alphabets:string[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "All"];
  @Output() callBack:EventEmitter<string[]> = new EventEmitter();

  eventSubscription:Subscription;
  apiSubscription:Subscription;
  apiSubscription2:Subscription;

  constructor(
    public activeModal: NgbActiveModal, 
    private eventService: EventemittersService,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) {
    this.searchControl.valueChanges.pipe(debounceTime(800)).subscribe({
      next: (inputVal:string) => {
        this.searchVal = inputVal;
        this.searchingMoreLocator();
      }, error: (err:any) => console.log(err)
    });
  }

  ngOnInit(): void {
    this.getBackedUpData();
  }

  getBackedUpData() {
    this.isApiProcess = true;
    this.eventSubscription = this.eventService.locatorDataMove.subscribe({
      next: (res:any) => {
        const { country, type } = this.locatorObj;
        const apiCacheKey = `${environment.apiurl}api/locator/${country}/${type}/${this.locatorType}`;

        if(!environment.apiDataCache.hasOwnProperty(apiCacheKey)) this.isApiProcess = true;
        else {
          const colName = this.locatorType=="exporter"? "Exp_Name": "Imp_Name";
          const data = environment.apiDataCache[apiCacheKey][colName];
          
          if(data.length>0) {
            this.backupLocatorData = [...data];
            this.setLocatorsArr([...data]);
          } else {
            setTimeout(() => {
              this.isError = true;
              this.isApiProcess = false;
            }, 1000);
          }
        }
      }, error: (err:any) => {
        this.isApiProcess = false;
        console.log(err);        
      }
    });
  }

  async setLocatorsArr(res:any, isFiltered=false) {
    this.isApiProcess = false;
    let locatorsArr = res;

    try {
      if(locatorsArr.length>0) {
        if(this.locatorObj.country=="India") {
          this.columnDirection = ((this.locatorObj.type=="export" && this.locatorType=="exporter") || (this.locatorObj.type=="import" && this.locatorType=="exporter")) ? "Exp_Name": "Imp_Name";
          locatorsArr = await this.alertService.getModifiedObj(locatorsArr, this.columnDirection);
        }
    
        if(!isFiltered) this.listArr = [...locatorsArr];
        this.copyArr = [...locatorsArr];
        this.perPageLocators = locatorsArr.splice(0, 100);
      } else {
        this.isError = true;
        this.copyArr = [];
      }
    } catch (error) {
      this.isError = true; //due to empty array in this condition      
    }    
  }

  ngAfterViewInit() {  }

  ngOnDestroy(): void {
    this.eventSubscription?.unsubscribe();
    this.apiSubscription?.unsubscribe();
    this.apiSubscription2?.unsubscribe();
  }

  getData() {
    if(this.listArr.length == 0) {
      this.isError = true;
      this.isApiProcess = false;
    } else this.isError = false;
  }

  searchingMoreLocator() {
    const { country, type, fromDate, toDate, countryType } = this.locatorObj;
    
    if(this.searchVal.length > 2) {
      this.isSelectAllShow = false;
      this.isApiProcess = true;
      const directionType = this.locatorType=="exporter" ? "export": "import";      
      const word = this.searchVal.toUpperCase();
      const locatorType = directionType=="import"? "Buyer": "Supplier";
      const direction = type;
      const dataObj = { country, direction, word, locatorType, countryType,  date: {from: fromDate, to: toDate} };

      this.apiSubscription2?.unsubscribe();
      this.apiSubscription2 = this.apiService.getGlobeImpExpLocator(dataObj, word).subscribe({
        next: (res:any) => {
          if(!res?.error) {
            this.isApiProcess = false;

            if(res?.results.length > 0) {
              this.currentPageNum = 0;
              this.perPageLocators = [];
              this.setLocatorsArr(res?.results, true);
              if(res?.results.length>0) this.isSelectAllShow = true;
            } else {
              this.setLocatorsArr([]);
              this.isSelectAllShow = false;
              this.perPageLocators = [];
              this.isError = true;
            }
          } else {
            this.isApiProcess = false;
            this.isError = true;
          }
        }, error: (err:any) => {
          console.log(err)
          this.isApiProcess = false;
          this.isError = true;
        }
      });
    } 
    
    if(this.searchVal.length == 0) {
      this.currentPageNum = 0;
      this.copyArr = [...this.listArr];
      this.perPageLocators = [...this.copyArr].splice(0, 100);
      this.isSelectAllShow = false;
    }
  }

  getLocatorsByLetter(letter:string) {
    this.listArr = [];
    const locators = {};
    this.currentPageNum = 0;
    this.perPageLocators = [];
    
    if(letter == "All") {
      if(this.apiSubscription) this.apiSubscription.unsubscribe();
      this.setLocatorsArr({...this.backupLocatorData});
      return;
    }

    const bodyObj = {
      alphabet: letter,
      countryname: this.locatorObj.country,
      direction: this.locatorObj.type,
      columnname: this.locatorType=="exporter" ? "Exp_Name" : "Imp_Name"
    };

    this.apiSubscription = this.apiService.getLocatorByChar(bodyObj).subscribe((res:any) => {
      if(!res?.error) {
        locators[bodyObj.columnname] = res?.results;
        this.setLocatorsArr({...locators});
      }
    });
  }

  //it's been shut down due to searching the locators now via online api
  sortList() {
    this.copyArr = [];
    const searchLen = this.searchVal.length;
    const searchType = this.locatorType=='exporter'?'Exp_Name':'Imp_Name';

    for(let i=0; i<this.listArr.length; i++) {
      let itemSubStr = '';
      try { itemSubStr = this.listArr[i][searchType].substring(0, searchLen); } //due to null
      catch (error) { continue; }

      if((itemSubStr).toLowerCase() == (this.searchVal).toLowerCase()) {
        this.copyArr.push(this.listArr[i]);
      }
    }
  }

  //for selecting multiple values at a time
  selectValue(item:any) {
    const val = this.locatorType=='exporter' ? item?.Exp_Name : item?.Imp_Name;
    this.selectedArr.push(val);
  }

  //for selecting single value which is just for temporary
  selectSingleValue(e:any, item:any) {
    const isChecked = e.target.checked;
    const key = this.locatorType=='exporter' ? "Exp_Name" : "Imp_Name";
    const selectedInpArr:any = document.querySelectorAll("input[type='checkbox']:checked");
    const val =  item[key];
    
    if(isChecked) this.selectedArr.push(val);
    else this.selectedArr = this.selectedArr.filter(item => item != val);
  }

  selectAllValues(dataArr:any[]) {
    this.isMainSelect = !this.isMainSelect;
    const key = this.locatorType=='exporter' ? "Exp_Name" : "Imp_Name";
    this.selectedArr = this.isMainSelect ? dataArr.map(item => item[key]) : [];
    // const selectedAllItems = this.isMainSelect ? dataArr.map(item => item[key]) : [];
    // selectedAllItems.forEach(item => this.selectedArr.push(item));
  }

  applyLocator() {
    const selectedData = this.selectedArr.length>0 
      ? this.selectedArr 
      : this.searchVal=="" 
          ? [] : [this.searchVal.toUpperCase()];

    this.callBack.emit(selectedData);
    this.closeModal();
  }

  partitionLocator(type:string) {
    const limit = 100;

    const tempPageNum = (type=="next" ? this.currentPageNum+1 : this.currentPageNum-1);
    if(tempPageNum < 0) return;
    if((this.copyArr.length/limit) <= tempPageNum) {
      this.hasExceeded = true;
      return;
    }
    if([...this.copyArr].splice(tempPageNum, limit).length==0) return;
    
    type=="next" ? this.currentPageNum++ : this.currentPageNum--;
    
    const offset =  this.currentPageNum * limit;
    const partitionedArr = [...this.copyArr].splice(offset, limit);

    if(partitionedArr.length == 0) return;

    this.perPageLocators = partitionedArr
  }

  closeModal() {this.activeModal.dismiss('Cross click');}
}
