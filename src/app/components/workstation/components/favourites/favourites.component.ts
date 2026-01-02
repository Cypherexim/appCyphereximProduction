import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationComponent } from '../../modals/confirmation/confirmation.component';
import { TableDataModalComponent } from 'src/app/components/homepage/components/table-data-modal/table-data-modal.component';
import { AlertifyService } from 'src/app/services/alertify.service';
import { CountryHeads } from 'src/app/models/country';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { ApiMsgRes } from 'src/app/models/api.types';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { timer, Subscription, take } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.css']
})
export class FavouritesComponent implements OnInit, OnChanges, OnDestroy{
  constructor(
    private modalService: NgbModal,
    private alertService: AlertifyService,
    private eventService: EventemittersService,
    private apiService: ApiServiceService,
    private authService: AuthService
  ) {}

  @Input() favouritesArr:any[] = [];
  @Input() backTrigger:boolean = false;
  @Output() resetTrigger = new EventEmitter<string>();


  eventSubscription:Subscription = new Subscription();
  apiSubscription:Subscription = new Subscription();
  timerSubscription:Subscription = new Subscription();

  isLoading:boolean = false;
  favoriteTableHeads:string[] = ["", "company", "value", "hs code", "country", "date", "remove"];
  favoriteShipmentRes = {
    isLoading: false,
    isFolderView: true,
    favoriteShipmentsList: [],
    currentShipmentType: "",
    length: 0
  }
  favoriteShipmentsIds = {
    favorite: { shipments: [], length: 0 },
    toTheOrder: { shipments: [], length: 0 }
  };

  ngOnChanges(changes: SimpleChanges): void {   
    console.log(changes["backTrigger"]["currentValue"]) 
    if(changes["backTrigger"]["currentValue"]) { this.getResetFavorites(); }
  }

  ngOnInit(): void {
    this.onGettingFavoritesIds();
  }

  ngOnDestroy(): void {
    this.eventSubscription?.unsubscribe();
    this.apiSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  onGettingFavoritesIds() {
    this.apiService.getFavoriteShipmentRecords(this.authService.getUserId()).subscribe({
      next: (res:ApiMsgRes) => {
        const result = res?.results[0];

        this.apiService.getFavoriteShipmentCount({
          userId: this.authService.getUserId(),
          toTheOrder: result?.to_the_order_ids,
          favorite: result?.shipment_ids
        }).subscribe({
          next: (res:ApiMsgRes) => {                  
            this.favoriteShipmentsIds = {
              favorite: { shipments: result?.shipment_ids || [], length: res?.results[0]?.favoriteCount || 0 },
              toTheOrder: { shipments: result?.to_the_order_ids || [], length: res?.results[0]?.toTheOrderCount || 0 }
            }
          }
        });
      }
    });
  }

  getFavoriteShipmentList(type:string) {
    this.favoriteShipmentRes.isLoading = true;
    const shipmentIdsStr = this.favoriteShipmentsIds[type]?.shipments?.toString();

    if(shipmentIdsStr!=="") {
      this.apiService.getFavoriteShipmentRecords(this.authService.getUserId(), true, shipmentIdsStr).subscribe({
        next: (res:ApiMsgRes) => {
          const modifiedResult = res?.results?.map((item:any) => ({...item, favorite_shipment: JSON.parse(item?.favorite_shipment)}));
          this.favoriteShipmentRes.favoriteShipmentsList = modifiedResult;
          this.favoriteShipmentRes.isLoading = false;
          this.favoriteShipmentRes.currentShipmentType = type;
        }, error: (err:any) => console.error(err)
      });
    } else {
        this.favoriteShipmentRes.favoriteShipmentsList = [];
        this.favoriteShipmentRes.isLoading = false;
        this.favoriteShipmentRes.currentShipmentType = type;
    }
  }

  openFavoriteFolder(type:string) {
    this.favoriteShipmentRes.isLoading = true;
    this.favoriteShipmentRes.isFolderView = false;
    this.favoriteShipmentRes.length = this.favoriteShipmentsIds[type]?.length;
    this.getFavoriteShipmentList(type);
    this.resetTrigger.emit(type==='favorite'? "favourites": "to the order");
  }

  getResetFavorites() {
    this.favoriteShipmentRes = {
      isLoading: false,
      isFolderView: true,
      favoriteShipmentsList: [],
      currentShipmentType: "",
      length: 0
    }
  }

  onRemoveItem(shipmentId:string|number, recordId?:string|number) {
    const modalRef = this.modalService.open(ConfirmationComponent, { windowClass: 'confirmModalClass', centered: true });
    (<ConfirmationComponent>modalRef.componentInstance).callBack.subscribe((flag:boolean) => {
      if(flag) {
        this.favoriteShipmentsIds[this.favoriteShipmentRes.currentShipmentType].shipments = this.favoriteShipmentsIds[this.favoriteShipmentRes?.currentShipmentType]?.shipments?.filter((id:string|number) => id !== shipmentId);
        this.favoriteShipmentsIds[this.favoriteShipmentRes.currentShipmentType].length = this.favoriteShipmentsIds[this.favoriteShipmentRes?.currentShipmentType]?.shipments?.length;
        this.getFavoriteShipmentList(this.favoriteShipmentRes.currentShipmentType);
        this.deleteBookmarkRecords(shipmentId);
        this.timerSubscription = timer(1000).subscribe({next: () => {
          this.eventService.bookmarkActionEvent.next({ recordId, shipmentId, actionFlag: true, bookmarkType: this.favoriteShipmentRes.currentShipmentType});
        }});
      }
    });
  }

  deleteBookmarkRecords(shipmentId:string|number) {
    this.apiService.removeFavoriteShipment({
      userId: this.authService.getUserId(),
      favoriteId: shipmentId
    }).pipe(take(1)).subscribe();
  }

  getDateInNum():number {
    const today = new Date();
    const month = (today.getMonth()+1)<10 ? `0${today.getMonth()+1}`: today.getMonth()+1;
    const date = today.getDate()<10 ? `0${today.getDate()}`: today.getDate();
    const year = today.getFullYear();
    return Number(`${month}${date}${year}`);
  }

  showDetailModal(dataRes:any) { 
    const data = dataRes?.favorite_shipment;   
    const countryHeadModal = new CountryHeads().fetchCountryHeads(dataRes?.country)[data?.Type.toLowerCase()];
    const isModalAvail:boolean = Object.keys(countryHeadModal).length > 0;
    const keyValues = [];

    if(isModalAvail) {
      if(data?.Type.toLowerCase()=="import") countryHeadModal["BE_NO"] = "SHIPMENT ID";
      else countryHeadModal["SB_NO"] = "SHIPMENT ID";
    }

    const finalizeDataObj = isModalAvail ? countryHeadModal : data;
    if(this.favoriteShipmentRes?.currentShipmentType==="favorite" || dataRes?.country!=="india" && data?.Type.toLowerCase()!=="export") {
      delete finalizeDataObj["Updated_Imp_Name"];
    }

    for (let key in finalizeDataObj) {
      const dataItem: any = {};
      dataItem['key'] = isModalAvail ? countryHeadModal[key] : key;
      dataItem['value'] = key=="BE_NO" || key=="SB_NO" ? Number(data[key])+this.getDateInNum() : data[key];
      keyValues.push(dataItem);
    }
    
    const modalRef = this.modalService.open(TableDataModalComponent, { windowClass: 'tableDataPopUpModalClass', centered: true });
    (<TableDataModalComponent>modalRef.componentInstance).tableData = keyValues;
  }

  convertValueInUsd(value:number) {
    return this.alertService.valueInBillion(value);
  }
}
