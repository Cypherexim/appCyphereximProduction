import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SideFilterModel } from 'src/app/models/others';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-search-data',
  templateUrl: './search-data.component.html',
  styleUrls: ['./search-data.component.css']
})
export class SearchDataComponent implements OnInit, OnDestroy, AfterViewInit{
  currentPage:string = 'home';
  currentFact:number = 0;
  isCloseAlertBox:boolean = false;
  isSearchingData:boolean = false;
  isRefresh:boolean= false; //to refresh the home component if it is called with sidefilter
  isAnalysisTabActive:boolean = false; //to switch tab from analysis to data or vice-verse
  currentEventBind:any;
  profileOption:string = '';
  eventSubscription: Subscription;
  filterOptions:SideFilterModel = new SideFilterModel;
  navBarShowpages:string[] = ['home', 'workspace', 'download', 'favourite', 'analysisNav']; // 'analysis', >>> analysis comp. is gone
  analysisNavs:string[] = ['trending', 'companyProfile', 'hsCodeAnalysis', 'countryAnalysis', 'timeAnalysis', 'exporterAnalysis', 'importerAnalysis', 'customizeAnalysis'];
  currentAnalysisPage:string = '';
  intervalVal:any;

  loadingFacts:string[] = [
    "Import and Export data are used to determine the value of goods and services traded between countries.", 
    "The import data reflects the total value of goods and services purchased from foreign countries, while the export data reflects the total value of goods and services sold to foreign countries.",
    "Imports and exports are important for economic growth, as they allow countries to diversify their markets and increase the level of competition.",
    "The United States is the world's largest exporter, with a total value of exports of $2.2 trillion in 2019.",
    "The United States is also the world's largest importer, with a total value of imports of $2.6 trillion in 2019.",
    "The top countries that the United States exports to are Canada, Mexico, China, Japan, and Germany.",
    "The top countries that the United States imports from are China, Mexico, Canada, Japan, and Germany.",
    "The top export categories for the United States are machinery, vehicles, and electronics.",
    "The top import categories for the United States are machinery, electronics, and vehicles.",
    "Import and export data is used to analyze trends in global trade and to determine the balance of trade between countries.",
    "Import and export data is also used to measure the competitiveness of industries and to identify potential new markets.",
    "Trade agreements between countries can affect the value of imports and exports.",
    "Tariffs and import quotas can also affect the value of imports and exports.",
    "The value of imports and exports can also be affected by currency exchange rates.",
    "Many countries also use import and export data to track the flow of goods and services between countries.",
    "Import and export data is also used to monitor the impacts of international trade policies.",
    "Import and export data is collected by the U.S. Department of Commerce, the U.S. Census Bureau, and other government agencies.",
    "The United States also collects data from other countries through bilateral agreements and the World Trade Organization.",
    "Import and export data is used by governments to formulate and implement international trade policies.",
    "Import and export data is also used by businesses to analyze potential markets and identify potential opportunities for growth."
  ];

  constructor(
    private eventService: EventemittersService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    if(this.hasCurrentUserLoggedIn()) {
      this.currentEventBind = this.eventService.headerClickEvent.subscribe({
        next: (value:string) => {
          if(value.split('-').length > 1) {
            if(value.split('-')[0] == 'profile') this.profileOption = value.split('-')[1];
    
            this.onOptionClick(value.split('-')[0]);
          } else if(this.analysisNavs.includes(value)) {
            this.currentAnalysisPage = value;
            this.onOptionClick('analysisNav');
          } else this.onOptionClick(value);
        }, error: (err:any) => console.log(err)
      });
  
      this.eventSubscription = this.eventService.dataTabChngEvent.subscribe(res => {
        this.isAnalysisTabActive = res;
        if(this.currentPage != 'home') {
          this.currentPage = 'load';
          setTimeout(() => this.currentPage = 'home', 400);
        }
      });
  
      this.eventService.toggleSearchLoader.subscribe(res => {
        this.isSearchingData = res?.flag;
        if(this.isSearchingData) {
          this.intervalVal = setInterval(() => {
            this.currentFact = Math.floor(Math.random()*20);
          }, 10000);
        } else clearTimeout(this.intervalVal);
      });
    } else {
      const logoutTag = document.getElementById("logoutAnchor") as HTMLAnchorElement;
      logoutTag.click();
    }
  }

  ngAfterViewInit(): void {
    // if(this.hasCurrentUserLoggedIn()) {
    //   this.eventService.headerClickEvent.emit("trending");
    // }
  }

  ngOnDestroy(): void {
    if(this.eventSubscription) this.eventSubscription.unsubscribe();
    this.eventService.stopSearchingEvent.next(false);
  }

  sidebarToggle() {
    const sidetag = document.getElementById('sidebar') as HTMLDivElement;
    sidetag.classList.toggle('sidebar-body-shrink');
  }

  onOptionClick = (sidebarOption:string) => {
    if(sidebarOption == 'home') {
      this.currentPage = 'load';
      this.isRefresh = true;
      setTimeout(() => {
        this.currentPage = sidebarOption;
        this.isRefresh = false;
      }, 500);
    } else this.currentPage = sidebarOption;
  }

  //when data would have come then filter option event would be 
  //emitted here to send data to sidebar
  getSideFilterData(data:SideFilterModel) {
    this.filterOptions = data;
  } 

  onCancelClick() {
    this.eventService.stopSearchingEvent.next(true);
  }

  hasCurrentUserLoggedIn() {
    const hasUserLoggedIn = JSON.parse(window.localStorage.getItem("currentUser"));
    const currentpath = window.location.pathname;
    
    if(Object.keys(hasUserLoggedIn).length==0 && currentpath == "/home") return false;
    else return true;
  }

  closeAlertBos() {
    this.isCloseAlertBox = true;
  }
}
