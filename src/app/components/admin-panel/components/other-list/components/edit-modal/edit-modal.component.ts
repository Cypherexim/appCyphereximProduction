import { Component, Output, Input, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, timer } from 'rxjs';
import { ApiMsgRes } from 'src/app/models/api.types';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.css']
})
export class EditModalComponent implements OnInit, OnDestroy {
  isUpdateMode:boolean = false;
  currentCountryObj:any = {};
  @Output() callback:EventEmitter<boolean> = new EventEmitter<boolean>();
  
  direction:string = "";
  sideFilterData:any;
  filterHeads:string[] = ["HsCode", "ProductDesc", "Exp_Name", "Imp_Name", "CountryofDestination", "CountryofOrigin", "PortofOrigin", "PortofDestination", "Mode", "uqc", "Quantity", "Currency", "Month", "Year", "LoadingPort", "NotifyPartyName"];

  isCountryForm:boolean = true;
  isSubmitted:boolean = false;
  submitBtn:string = "Submit";
  isError:any = {flag: false, type: ""};
  countryName:string = "";
  countryType:string = "STATISTICAL";
  countryDirection:any = {
    Import: true,
    Export: true
  };
  allCountryList:any[] = [];
  allCountryCodeList:any[] = [];
  apiSubscription:Subscription = new Subscription();
  apiSubscription2:Subscription = new Subscription();
  apiSubscription3:Subscription = new Subscription();
  timerSubscription:Subscription = new Subscription();

  constructor(
    private activeModal: NgbActiveModal,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) {}

  ngOnInit(): void {
    if(this.isUpdateMode) {
      this.countryName = this.currentCountryObj["CountryName"]?.toLowerCase();
      this.countryType = this.currentCountryObj["data_type"];
      this.countryDirection.Import = this.currentCountryObj["Import"];
      this.countryDirection.Export = this.currentCountryObj["Export"];
    }

    if(!this.isCountryForm) {
      // if(this.sideFilterData.hasOwnProperty("Import")) this.direction = "Import";
      // else this.direction = "Export";
      
      // const cpyFilterData = {...this.sideFilterData?.filters};
      // delete cpyFilterData["Id"];
      // delete cpyFilterData["Direction"];
      // delete cpyFilterData["Country"];

      // this.filterHeads = Object.keys(cpyFilterData);
      this.direction = this.sideFilterData?.Direction;
    }
    this.getAllAvailableCountries();
    this.getAllCountryCodesList();
  }

  ngOnDestroy(): void {
    this.apiSubscription?.unsubscribe();
    this.apiSubscription2?.unsubscribe();
    this.apiSubscription3?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  getAllAvailableCountries() {
    const countryAPIkey = `${environment.apiurl}api/getAllAvailableCountries`;
    if(environment.apiDataCache.hasOwnProperty(countryAPIkey)) {
      this.allCountryList = environment.apiDataCache[countryAPIkey];
    } else {
      this.apiSubscription = this.apiService.getAllGlobeCountries().subscribe({
        next: (res:any) => {
          if(!res?.error) {
            this.allCountryList = res.results;
            environment.apiDataCache[countryAPIkey] = this.allCountryList;
          }
        }, error: (err:any) => console.log(err)
      });
    }
  }

  getAllCountryCodesList() {
    this.apiSubscription3 = this.apiService.getAllCountrycodes().subscribe({
      next: (res:ApiMsgRes) => {
        if(!res.error) {
          this.allCountryCodeList = res.results;
        }
      }, error: (err:ApiMsgRes) => console.log(err.message)
    });
  }

  closeModal(callby="") {
    this.activeModal.dismiss('Cross click');
    if(callby == "") this.callback.emit(true);
  }

  onCheckingExistingCountry() {    
    const existingCountry = this.allCountryList.filter((country:any) => (country?.CountryName.toLowerCase()===this.countryName.toLowerCase() && country?.data_type===this.countryType));
    if(existingCountry.length>0) {
      this.isError = {flag: true, type: "exist"};
    } else {
      this.isError = {flag: false, type: "exist"};
    }
  }




  onSubmit() {
    if(this.isError.flag) return;
    if(this.countryName == "") {
      this.isError = {flag: true, type: "required"};

      this.timerSubscription?.unsubscribe();
      this.timerSubscription = timer(2500).subscribe({next: () => { this.isError = {flag: true, type: "required"}; }});
      return;
    }

    this.submitBtn = "Submitting...";
    const bodyObj = {
      countryName: this.countryName[0].toUpperCase() + this.countryName.substring(1, this.countryName.length),
      // countryCode: this.countryName.substring(0, 3).toLocaleUpperCase(),
      countryType: this.countryType,
      imp: this.countryDirection?.Import,
      exp: this.countryDirection?.Export,
    };

    if(this.isUpdateMode) delete bodyObj["countryName"];

    this.apiSubscription2 = this.apiService.addNewCountry(bodyObj, this.isUpdateMode).subscribe({
      next: (res:any) => {
        if(!res.error) this.alertService.success("Country added successfully!");
        else this.alertService.success(res?.message);
        this.submitBtn = "Submit";
        this.isSubmitted = true;
      }, error: (err:any) => console.log(err)
    });
  }
}
