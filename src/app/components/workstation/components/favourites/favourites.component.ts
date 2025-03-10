import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationComponent } from '../../modals/confirmation/confirmation.component';
import { TableDataModalComponent } from 'src/app/components/homepage/components/table-data-modal/table-data-modal.component';
import { AlertifyService } from 'src/app/services/alertify.service';
import { CountryHeads } from 'src/app/models/country';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.css']
})
export class FavouritesComponent implements OnInit{
  constructor(
    private modalService: NgbModal,
    private alertService: AlertifyService
  ) {}

  @Input() favouritesArr:any[] = [];

  isLoading:boolean = false;

  ngOnInit(): void {
    setTimeout(() => console.log(this.favouritesArr), 2000)
  }

  onRemoveItem(dataId:any) {
    const modalRef = this.modalService.open(ConfirmationComponent, { windowClass: 'confirmModalClass' });
    (<ConfirmationComponent>modalRef.componentInstance).dataId = dataId;
  }

  getDateInNum():number {
    const today = new Date();
    const month = (today.getMonth()+1)<10 ? `0${today.getMonth()+1}`: today.getMonth()+1;
    const date = today.getDate()<10 ? `0${today.getDate()}`: today.getDate();
    const year = today.getFullYear();
    return Number(`${month}${date}${year}`);
  }

  showDetailModal(data:any) {
    const {country, Type} = data;
    const countryHeadModal = new CountryHeads().fetchCountryHeads(country)[Type.toLowerCase()];
    const isModalAvail:boolean = Object.keys(countryHeadModal).length > 0;
    if(isModalAvail) {
      if(Type.toLowerCase()=="import") countryHeadModal["BE_NO"] = "SHIPMENT ID";
      else countryHeadModal["SB_NO"] = "SHIPMENT ID";
    }
    let tempArr = [];

    for (let key in { ...(isModalAvail ? countryHeadModal : data) }) {
      const temObj: any = {};
      temObj['key'] = isModalAvail ? countryHeadModal[key] : key;
      temObj['value'] = key=="BE_NO" || key=="SB_NO" ? Number(data[key])+this.getDateInNum() : data[key];
      tempArr.push(temObj);
    }

    const modalRef = this.modalService.open(TableDataModalComponent, { windowClass: 'tableDataPopUpModalClass' });
    (<TableDataModalComponent>modalRef.componentInstance).tableData = tempArr;
  }

  convertValueInUsd(value:number) {
    return this.alertService.valueInBillion(value);
  }
}
