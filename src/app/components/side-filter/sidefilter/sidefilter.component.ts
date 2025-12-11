import { AfterViewInit, Component, EventEmitter, OnInit, Output, Input, OnDestroy, OnChanges} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { SideFilterAccessModel, SideFilterModel, FilterNames } from 'src/app/models/others';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { SearchService } from 'src/app/services/search.service';
import { UserService } from 'src/app/services/user.service';
import { FilterDataListComponent } from '../modals/filter-data-list/filter-data-list.component';
import { SaveFileComponent } from '../modals/save-file/save-file.component';

@Component({
  selector: 'app-sidefilter',
  templateUrl: './sidefilter.component.html',
  styleUrls: ['./sidefilter.component.css']
})
export class SidefilterComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  isSidebarHide:boolean = true;
  selectedItemArr:any[] =[];
  fileName:string = '';
  filterValue:string = '';
  currentModalType:string = '';
  userSelectedCountry:string[] = [];
  productDescSearch:string[] = [];
  isDropVisible:boolean = false;
  word:string = "";
  isFilterUp:boolean = false;
  wordsArr:string[] = [];
  
  @Output() onSidebarToggle = new EventEmitter<boolean>();
  @Output() onOptionClick = new EventEmitter<string>();
  @Input() filterOptions:SideFilterModel = new SideFilterModel;
  @Input() savedFileName:string = '';
  @Input() currentPage:string = '';
  sideFilterAccess:SideFilterAccessModel = new SideFilterAccessModel();
  sideFilterNaming:FilterNames = new FilterNames();
  
  eventSubscription1:Subscription;
  eventSubscription2:Subscription;
  // eventSubscription3:Subscription;
  eventSubscription4:Subscription;
  filterBarVisibility:boolean = false;
  allowFilterPages:string[] = ["home", "analysisNav"];

  inputRange:number = 0;
  btnAccessibility:boolean = true;

  constructor(
    public eventService: EventemittersService,
    public userService: UserService,
    private searchService: SearchService,
    public authService: AuthService,
    public alertService: AlertifyService,
    private apiService: ApiServiceService
  ) {}

  ngOnInit() {
    //this event will be triggered once the user start searching and get the data table
    //so that sidefilter has to be visible
    this.eventSubscription1 = this.eventService.filterSidebarEvent.subscribe({
      next: (res:any) => {
        this.filterBarVisibility = res; //to set the visibility of filter sidebar -> ON
        this.selectedItemArr = []; //to empty selected checkbox while changing component
        
      }, error: (err:any) => console.log(err)
    });

    this.eventSubscription2 = this.eventService.currentCountry.subscribe(res => {
      if (res?.code == undefined || res?.direction == undefined || [undefined, "STATISTICAL"].includes(res?.type)) return;
      
      this.searchService.getSideFilterAccess(res?.code, res?.direction, res?.type).subscribe({
        next: (res2:any) => {
          if(res2 != null && res2?.results.length > 0) {
            const tempObj = {...res2?.results[0]};
            delete tempObj['Id'];
            tempObj['Country'] = true;
            this.sideFilterAccess = tempObj;
          }
        }, error: (err:any) => console.log(err)
      });
    });

    this.eventSubscription4 = this.eventService.userDetailsStore.subscribe({
      next: (res:any) => {
        if(Object.keys(res).length > 0) {
          this.btnAccessibility = Number(res["remainingdays"])<=0;
        } else this.btnAccessibility = false;
      }, error: (err:any) => console.log(err)
    });
  }

  ngOnChanges() {
    this.productDescSearch = [];
    this.word = "";
    // this.filterOptions.Exp_Name = this.filterOptions.Exp_Name.sort();
    // this.filterOptions.Imp_Name = this.filterOptions.Imp_Name.sort();
    //this.filterOptions.CountryofDestination = this.filterOptions.CountryofDestination.sort();
    // this.filterOptions.HsCode = this.filterOptions.HsCode.sort((a:any, b:any) => a-b);
  
    // if(this.allowFilterPages.includes(this.currentPage)) this.filterBarVisibility = true;
    // else this.filterBarVisibility = false;
  }

  ngOnDestroy(): void {
    this.eventSubscription1.unsubscribe();
    this.eventSubscription2.unsubscribe();
    // this.eventSubscription3.unsubscribe();
    this.eventSubscription4.unsubscribe();
    this.filterOptions = new SideFilterModel();
  }

  ngAfterViewInit(): void {
    const imgTag = document.getElementById("sidebarHandle") as HTMLImageElement;
    imgTag.click();
  }

  rangeChange() {
    const rangeInput:any = document.getElementById("myinput");
    const value = (rangeInput.value-rangeInput.min)/(rangeInput.max-rangeInput.min)*100;
    rangeInput.style.background = 'linear-gradient(to right, #82CFD0 0%, #82CFD0 ' + value + '%, #fff ' + value + '%, white 100%)';
  };

  toggleSidebar = (e:any) => {
    e.target.parentElement.classList.toggle('collapsed');
    this.isSidebarHide = !this.isSidebarHide;
    this.onSidebarToggle.emit(this.isSidebarHide);
    this.eventService.sidebarToggleEvent.emit({target: 'navbar', data: this.isSidebarHide});
  }

  onSideOptionClick(optionName:string) {
    if(this.btnAccessibility) {
      this.alertService.showPackageAlert("You don't have any remaining days left, please reanew your package to continue the service!");
      return;
    }

    if(optionName == 'home') {
      this.eventService.refreshPageNameEvent.next("advance");
      const inputTag = document.getElementById('savedFileName') as HTMLInputElement;
      inputTag.value = '';      
    }
    this.onOptionClick.emit(optionName);
  }

  onClickEnter(e:any, key:string) {
    if((e.key == 'Enter' || e.code == 'Enter') && this.word.length > 0) {
      this.productDescSearch = [this.word.toUpperCase()];
      this.eventService.hightlightDescBySidebar.next(this.productDescSearch[0]);
    }

    if (this.word.length >= 3) {
      this.apiService.getProductDescWords(this.word.toUpperCase()).subscribe((res: any) => {
        if (!res.error && res.results.length > 0) {
          this.wordsArr = res?.results.splice(0, 10);
        }
      });
    }
  }

  clearProductValues() {
    this.productDescSearch=[];
    this.word='';
    this.eventService.hightlightDescBySidebar.next('');
  }

  onSearchProductDesc(key, type){
    if(this.productDescSearch.length==0) return;

    if(type == "clear") {
      this.word = "";
      this.productDescSearch = [];
    }

    this.eventService.applyFilterEvent.emit({filters: this.productDescSearch, key: key})
  }

  onSearchByQuantity(key, type) {
    if(this.inputRange == 0) return;

    if(type=='clear') this.inputRange = 0;
    
    const dataObj = {
      filters: this.inputRange!=0 ? [this.inputRange] : [],
      key
    };

    this.eventService.applyFilterEvent.emit(dataObj);
    this.rangeChange();
  }

  saveDialogue(target) {this.onOptionClick.emit(target);}

  setVisibility(bool:boolean, value=null) {
    if(value != null) {
      this.productDescSearch = [value];
      this.isDropVisible = bool;
      this.word = "";
      this.eventService.hightlightDescBySidebar.next(this.productDescSearch[0]);
    } else {
      if(!bool) setTimeout(() => this.isDropVisible = bool, 500);
      else this.isDropVisible = bool;
    }
  }

  getAdvanceAccess():boolean {
    if(this.authService.getUserCountry()==='India'){
      if(this.authService.getUserDetails()["CountryAccess"] == "All") return true;
      else {
        const countriesArr:string[] = (this.authService.getUserDetails()["CountryAccess"]).split(",");
        if(countriesArr.includes("India")) return true;
        else return false;
      }
    } else return false;
  }
}
