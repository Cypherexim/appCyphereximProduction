import { DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserModel, UserPlanModel } from 'src/app/models/plan';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-list-modal',
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.css']
})
export class ListModalComponent implements OnInit {

  @Output() passback:EventEmitter<any> = new EventEmitter();
  tableName:string = '';
  listData:any[] = [];
  listHeads:string[] = [];

  constructor(
    private activeModal: NgbActiveModal, 
    private modalService: NgbModal,
    private datePipe: DatePipe,
    private eventService: EventemittersService
  ) { }

  ngOnInit(): void {}

  closeModal() {this.activeModal.dismiss('Cross click');}

  getAllHeads(data) {
    this.listData = data;
    this.listData["DownloadsAccess"] = this.listData["dwnlds"];
    delete this.listData["dwnlds"];
    
    this.listHeads = Object.keys(data);
    this.listHeads.splice(this.listHeads.indexOf("PlanId"), 1);
  }

  isValueUnlimited(data, key) {
    const keys = ["Downloads", "Searches", "Workspace", "WSSLimit"];
    if(keys.includes(key)) {
      try {
        if(Number(data[key]) >= 500000) return "UNLIMITED";
        else return data[key];
      } catch (error) {
        return data[key];
      }
    } else if(key == "EndDate" || key == "StartDate") 
      return this.datePipe.transform(data[key], "yyyy-MM-dd"); 
    else return data[key];
  }

  onClickButton(type, data=undefined) {
    const otherBools = ["analysis", "favoriteshipment", "companyprofile", "country"];
    const formModalVar:any = this.tableName=="plan" ? new UserPlanModel() : {...(new UserModel()), ...(new UserPlanModel())};
    this.listHeads = Object.keys(formModalVar); 

    if(type == "edit") {
      for(let key of this.listHeads) {
        if(!otherBools.includes(key)) formModalVar[key] = data[key];
        else {
          if(key == "Analysis") formModalVar.Analysis.hasAnalysis = data[key];
          else if(key == "Favoriteshipment") formModalVar.Favoriteshipment.hasFavorite = data[key];
          else if(key == "Companyprofile") formModalVar.Companyprofile.hasProfile = data[key];
          else if(key == "country") formModalVar["country"] = data["CountryCode"];
        }
      }

      formModalVar["selectedPlan"] = "";
      const dataObj = {type: this.tableName, data: formModalVar};
      
      this.eventService.setFormValues.next(dataObj);
    }
    
    this.passback.emit(type);
    this.closeModal();

    // const currentComponent = this.tableName == "plan" ? EditPlanFormComponent : EditUserFormComponent;
    // if(type == "edit") {
    //   const modalRef = this.modalService.open(currentComponent, {windowClass: 'tableDataPopUpModalClass'});
    //   if(this.tableName == "plan") {
    //     const callbackRef = (<EditPlanFormComponent>modalRef.componentInstance).callback.subscribe(res => callbackRef.unsubscribe());
    //   } else {
    //     const callbackRef = (<EditUserFormComponent>modalRef.componentInstance).callback.subscribe(res => callbackRef.unsubscribe());
    //   }
    // } else this.passback.emit("add");
  }
}
