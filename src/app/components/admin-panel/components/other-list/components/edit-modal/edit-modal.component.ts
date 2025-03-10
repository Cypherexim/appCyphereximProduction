import { Component, Output, Input, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.css']
})
export class EditModalComponent implements OnInit {
  isUpdateMode:boolean = false;
  currentCountryObj:any = {};
  @Output() callback:EventEmitter<boolean> = new EventEmitter<boolean>();

  timeoutVal:any;
  direction:string = "";
  sideFilterData:any;
  filterHeads:string[] = [];

  isCountryForm:boolean = true;
  isSubmitted:boolean = false;
  submitBtn:string = "Submit";
  isError:boolean = false;
  countryName:string = "";
  countryDirection:any = {
    Import: false,
    Export: false
  } 

  constructor(
    private activeModal: NgbActiveModal,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) {}

  ngOnInit(): void {
    if(this.isUpdateMode) {
      this.countryName = this.currentCountryObj["CountryName"];
      this.countryDirection.Import = this.currentCountryObj["Import"];
      this.countryDirection.Export = this.currentCountryObj["Export"];
    }

    if(!this.isCountryForm) {
      if(this.sideFilterData.hasOwnProperty("Import")) this.direction = "Import";
      else this.direction = "Export";   
      
      const cpyFilterData = {...this.sideFilterData?.filters};
      delete cpyFilterData["Id"];
      delete cpyFilterData["Direction"];
      delete cpyFilterData["Country"];

      this.filterHeads = Object.keys(cpyFilterData);
    }
  }

  closeModal(callby="") {
    this.activeModal.dismiss('Cross click');
    if(callby == "") this.callback.emit(true);
  }

  onSubmit() {
    if(this.countryName == "") {
      this.isError = true;

      if(this.timeoutVal) clearTimeout(this.timeoutVal);
      this.timeoutVal = setTimeout(() => this.isError = false, 2500);

      return;
    }

    this.submitBtn = "Submitting..."
    const bodyObj = {
      countryName: this.countryName[0].toUpperCase() + this.countryName.substring(1, this.countryName.length),
      countryCode: this.countryName.substring(0, 3).toLocaleUpperCase(),
      imp: this.countryDirection?.Import,
      exp: this.countryDirection?.Export
    };

    if(this.isUpdateMode) delete bodyObj["countryName"];

    this.apiService.addNewCountry(bodyObj, this.isUpdateMode).subscribe({
      next: (res:any) => {
        if(!res.error) this.alertService.success("Country added successfully!");
        else this.alertService.success(res?.message);
        this.submitBtn = "Submit";
        this.isSubmitted = true;
      }, error: (err:any) => console.log(err)
    });
  }
}
