import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AllRightsService {

  constructor() { }
 
  getUserAccessObj() {
    return JSON.parse(window.localStorage.getItem("userAccess"));
  }

  share = () => this.getUserAccessObj()["Share"];
  
  addUser = () => this.getUserAccessObj()["AddUser"];
  
  editUser = () => this.getUserAccessObj()["EditUser"];
  
  deleteUser = () => this.getUserAccessObj()["DeleteUser"];
  
  addPlan = () => this.getUserAccessObj()["AddPlan"];
  
  editPlan = () => this.getUserAccessObj()["EditPlan"];
  
  deletePlan = () => this.getUserAccessObj()["DeletePlan"];
  
  search = () => this.getUserAccessObj()["Search"];
  
  enableId = () => this.getUserAccessObj()["EnableId"];
  
  disableId = () => this.getUserAccessObj()["DisableId"];
  
  blockUser = () => this.getUserAccessObj()["BlockUser"];
  
  unblockUser = () => this.getUserAccessObj()["UnblockUser"];
  
  clientList = () => this.getUserAccessObj()["ClientList"];
  
  planList = () => this.getUserAccessObj()["PlanList"];
  
  downloadsAccess = () => this.getUserAccessObj()["DownloadsAccess"];
}
