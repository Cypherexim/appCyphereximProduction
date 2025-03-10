import { Component, OnInit, AfterViewInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  // @Input() isSpecific:boolean = false;
  @Input() isSelect: boolean = false;
  isToggleClosed: boolean = true;
  lastHtmlTag: HTMLSpanElement;
  userPlanDetails: any = {};

  searchedAnalysisData: any = {};

  eventSubscription: Subscription;
  eventSubscription2: Subscription;
  eventSubscription3: Subscription;
  eventSubscription4: Subscription;

  constructor(
    private eventService: EventemittersService,
    private alertService: AlertifyService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isSelect && this.lastHtmlTag) this.lastHtmlTag.classList.remove('scaled-btn');
  }

  ngOnInit(): void {
    this.eventSubscription2 = this.eventService.sidebarToggleEvent.subscribe(res => {
      this.isToggleClosed = res.data;
    });

    this.eventSubscription3 = this.eventService.userDetailsStore.subscribe(res => {
      this.userPlanDetails = res;
      // this.userPlanDetails["Analysis"] = "exporter analysis,importer analysis";
    });

    this.eventService.setAnalysisDataEvent.subscribe({
      next: (res: any) => {
        this.searchedAnalysisData = res;
      }, error: (err: any) => console.log(err)
    });

    this.setToCompanyProfile();
  }

  hasAleradySearched(): boolean {
    return Object.keys(this.searchedAnalysisData).length > 0;
  }

  isAllowedToUse(key: string): boolean {
    if (key == "trending") return true;

    const analysisStr = this.userPlanDetails["Analysis"];
    const companyProfile = this.userPlanDetails["Companyprofile"];
    const isAnalysis: boolean = key.toLowerCase().includes("analysis");

    if (isAnalysis) {
      if (analysisStr == "All") return true;
      else {
        const analysisArr = analysisStr.split(",");
        const keyAnalysis = `${key.split("A")[0].toLowerCase()} a${key.split("A")[1].toLowerCase()}`;

        if (analysisArr.includes(keyAnalysis)) return true
        else return false;
      }
    } else {
      if (["", "0", 0].includes(companyProfile)) return false;
      else return true;
    }
  }

  ngOnDestroy(): void {
    this.eventSubscription.unsubscribe();
    this.eventSubscription2.unsubscribe();
    this.eventSubscription3.unsubscribe();
    this.eventSubscription4.unsubscribe();
  }

  ngAfterViewInit(): void {

  }

  onClickNavBtn(e: any, page: string = "") {
    if (page != "trending" && Number(this.userPlanDetails["remainingdays"]) <= 0) {
      this.alertService.showPackageAlert("You don't have any remaining days left, please renew your package to continue the service!");
      return;
    }

    if (this.isAllowedToUse(page)) {
      if (this.lastHtmlTag) this.lastHtmlTag.classList.remove('scaled-btn');

      this.lastHtmlTag = e.target;
      e.target.classList.add('scaled-btn');


      if (page != '') {
        const pageName = page == "companyProfile" ? 'company profile' : 'analysis';
        //<temp>,"companyProfile"      !this.hasAleradySearched() && !["trending"].includes(page)

        if (!this.hasAleradySearched() && !["trending"].includes(page)) this.alertService.showPackageAlert(`You cannot see the ${pageName} without searching data. You have to search the data in order to see the ${pageName}.`);
        else {
          if (page == "companyProfile" && e.target.dataset.click == "self") this.alertService.showPackageAlert("Please choose any one company from 'Exporter' or 'Importer' counter tab in order to obtain company profile.");
          else {
            this.eventService.headerClickEvent.emit(page);
            if (page == "companyProfile") e.target.dataset.click = "self";
          }
        }
        // this.eventService.headerClickEvent.emit(page);
        // if(page == "companyProfile") e.target.dataset.click = "self";
      }
    } else { this.alertService.showPackageAlert(); }
  }

  onFocusOut(e: any) {
    try {
      // if(this.lastHtmlTag) this.lastHtmlTag.classList.remove('scaled-btn');
    } catch (error) { }
  }

  setToCompanyProfile() {
    this.eventSubscription4 = this.eventService.companyProfileEvent.subscribe((res: any) => {
      if (Object.keys(res).length > 0 && res?.target == "navbar") {
        const { companyName, direction, country, tabDirectionType, selectedDate } = res;
        const navBtn = document.getElementById("profile-btn-1") as HTMLSpanElement;
        navBtn.dataset.click = "auto";

        this.eventService.companyProfileEvent.next({
          target: "companyProfile", tabDirectionType,
          companyName, direction, country, selectedDate
        });
        navBtn.click();
      }
    });
  }
}
