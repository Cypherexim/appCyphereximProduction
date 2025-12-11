import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavMenuComponent } from './components/nav-menu/nav-menu/nav-menu.component';
import { SidefilterComponent } from './components/side-filter/sidefilter/sidefilter.component';
import { SearchDataComponent } from './components/search-data/search-data.component';
import { PlansComponent } from './components/page-not-found/plans.component';
import { UserLoginComponent } from './components/users/user-login/user-login.component';
// import { AdminComponent } from './components/users/admin/admin.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DatePipe, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FilterPipe } from './common/Pipes/filter.pipe';

import { CountryListComponent } from './components/admin-panel/country-list/country-list.component';
import { NgbModule, NgbActiveModal, NgbTooltipModule, NgbPaginationModule, NgbPaginationConfig } from '@ng-bootstrap/ng-bootstrap';
import { OnhoverClickDirective } from './common/directives/onhover-click.directive';
import { RotateArrowDirective } from './common/directives/rotate-arrow.directive';
import { HomepageComponent } from './components/homepage/homepage.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { PlanTemplateComponent } from './components/user-profile/components/plan-template/plan-template.component';
import { WorkstationComponent } from './components/workstation/workstation.component';
import { NavbarComponent } from './components/nav-menu/navbar/navbar.component';
import { TeamProfileComponent } from './components/team-profile/team-profile.component';
import { ClientsComponent } from './components/admin-panel/components/clients/clients.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { UserPanelComponent } from './components/admin-panel/components/user-panel/user-panel.component';
import { InputFieldComponent } from './components/admin-panel/components/user-panel/input-field/input-field.component';
import { ToggleDirective } from './common/directives/toggle.directive';
import { NgChartsModule } from 'ng2-charts';
import { FilterDataListComponent } from './components/side-filter/modals/filter-data-list/filter-data-list.component';
import { SaveFileComponent } from './components/side-filter/modals/save-file/save-file.component';
import { EllipsisPipe } from './common/Pipes/ellipsis.pipe';
import { TableDataModalComponent } from './components/homepage/components/table-data-modal/table-data-modal.component';
import { DropdownBoxComponent } from './components/side-filter/components/dropdown-box/dropdown-box.component';
import { WhatsTrendingComponent } from './components/graphs/whats-trending/whats-trending.component';
import { CardChartComponent } from './components/graphs/components/card-chart/card-chart.component';
import { CardMdChartComponent } from './components/graphs/components/card-md-chart/card-md-chart.component';
import { CommodityTableComponent } from './components/graphs/components/commodity-table/commodity-table.component';
import { TableCardChartComponent } from './components/graphs/components/table-card-chart/table-card-chart.component';
import { CountriesMapModule } from 'countries-map';
import { ConfirmationComponent } from './components/workstation/modals/confirmation/confirmation.component';
import { ListModalComponent } from './components/admin-panel/components/list-modal/list-modal.component';
import { DownloadModelComponent } from './components/homepage/components/download-model/download-model.component';
import { MultiselectDropdownComponent } from './components/multiselect-dropdown/multiselect-dropdown.component';
import { SideFilterPipe } from './common/Pipes/side-filter.pipe';
import { LocatorModalComponent } from './components/homepage/components/locator-modal/locator-modal.component';
import { SortHsCodePipe } from './common/Pipes/sort-hs-code.pipe';
import { HsCodeTreeComponent } from './components/side-filter/components/hs-code-tree/hs-code-tree.component';
import { AllAnalysisComponent } from './components/graphs/all-analysis/all-analysis.component';
import { PreviewComponent } from './components/admin-panel/components/user-panel/preview/preview.component';
import { UserAlertModalComponent } from './components/homepage/components/user-alert-modal/user-alert-modal.component';
import { OtherListComponent } from './components/admin-panel/components/other-list/other-list.component';
import { EditModalComponent } from './components/admin-panel/components/other-list/components/edit-modal/edit-modal.component';
import { CompanyProfileComponent } from './components/graphs/company-profile/company-profile.component';
import { ProfilePopupComponent } from './components/graphs/components/profile-popup/profile-popup.component';
import { SplitHsCodePipe } from './common/Pipes/split-hs-code.pipe';
import { NotifyAlertMsgComponent } from './components/workstation/modals/notify-alert-msg/notify-alert-msg.component';
import { NotificationComponent } from './components/notification/notification.component';
import { NotificationPasswordComponent } from './components/admin-panel/components/notification-password/notification-password.component';
import { AuthTokenInterceptor } from './common/interceptor/auth-token-ceptor.interceptor';
import { HelpdeskComponent } from './components/others/helpdesk/helpdesk.component';
import { LogsComponent } from './components/admin-panel/components/logs/logs.component';
import { CustomAnalysisComponent } from './components/graphs/custom-analysis/custom-analysis.component';
import { CompanyHunterComponent } from './components/company-hunter/company-hunter.component';
import { FavouritesComponent } from './components/workstation/components/favourites/favourites.component';
import { PivotPipe } from './common/Pipes/pivot.pipe';
import { CalculateFinancialValuePipe } from './common/Pipes/calculate-financial-value.pipe';
import { ProfileValuePipe } from './common/Pipes/profile-value.pipe';


@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    SidefilterComponent,
    SearchDataComponent,
    PlansComponent,
    UserLoginComponent,
    // AdminComponent,
    FilterPipe,
    CountryListComponent,
    OnhoverClickDirective,
    RotateArrowDirective,
    HomepageComponent,
    UserProfileComponent,
    PlanTemplateComponent,
    WorkstationComponent,
    NavbarComponent,
    TeamProfileComponent,
    ClientsComponent,
    AdminPanelComponent,
    UserPanelComponent,
    InputFieldComponent,
    ToggleDirective,
    FilterDataListComponent,
    SaveFileComponent,
    EllipsisPipe,
    TableDataModalComponent,
    DropdownBoxComponent,
    WhatsTrendingComponent,
    CardChartComponent,
    CardMdChartComponent,
    CommodityTableComponent,
    TableCardChartComponent,
    ConfirmationComponent,
    ListModalComponent,
    DownloadModelComponent,
    MultiselectDropdownComponent,
    SideFilterPipe,
    LocatorModalComponent,
    SortHsCodePipe,
    HsCodeTreeComponent,
    AllAnalysisComponent,
    PreviewComponent,
    UserAlertModalComponent,
    OtherListComponent,
    EditModalComponent,
    CompanyProfileComponent,
    ProfilePopupComponent,
    SplitHsCodePipe,
    NotifyAlertMsgComponent,
    NotificationComponent,
    NotificationPasswordComponent,
    HelpdeskComponent,
    LogsComponent,
    CustomAnalysisComponent,
    CompanyHunterComponent,
    FavouritesComponent,
    PivotPipe,
    CalculateFinancialValuePipe,
    ProfileValuePipe,
 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ScrollingModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    NgChartsModule,
    CountriesMapModule,
    NgbTooltipModule,
    NgbPaginationModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass:  AuthTokenInterceptor, multi: true },
    HttpClientModule, NgbActiveModal, DatePipe, EllipsisPipe, FilterPipe, SortHsCodePipe, 
    {provide: LocationStrategy, useClass: PathLocationStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
