import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { ApiServiceService } from './api-service.service';
import { Observable } from 'rxjs';
import { ApiMsgRes } from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public apiPath: string = environment.apiurl;
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiService: ApiServiceService
  ) { }

  getHsCode(digit="") {
    return digit!="" ? this.http.get<any>(this.apiPath + 'api/gethscode?digit=' + digit)
    : this.http.get<any>(this.apiPath + 'api/gethscode');
  }

  getCountrylist(){    
    return this.http.get<any>(this.apiPath + 'api/getContries');
  }

  userRegistration(user: any){
    return this.http.post<any>(this.apiPath + 'api/signup', user);
  }

  //api to update download and searches points
  updateUserPoints() {
    return this.http.get<any>(this.apiPath + `api/getAccountDetails?UserId=${this.authService.getUserId()}`);
  }

  
  //-------------------------Admin Apis--------------------------//
  //add plan service
  addUserPlan(planData: any, isUpdate=false) {
    const { PlanName, Validity, DataAccess, CountryAccess, Downloads, Searches, CommodityAccess, TarrifCodeAccess, Workspace, WSSLimit, Downloadfacility, Favoriteshipment, Whatstrending, Companyprofile, Contactdetails, Addonfacility, Analysis, User } = planData?.addPlan;

    const formData = {
      PlanName, Validity, DataAccess, Downloads, Searches, CountryAccess, 
      CommodityAccess, TarrifCodeAccess,Workspace, WSSLimit, Downloadfacility, 
      Whatstrending, Contactdetails, Addonfacility, User, Favoriteshipment, 
      Companyprofile, Analysis, Amount: "0"
    };
    
    if(isUpdate) formData["PlanId"] = planData?.addPlan?.PlanId;

    ["Searches", "Downloads", "WSSLimit", "Workspace"].forEach(item => {
      if(formData.hasOwnProperty(item) && formData[item] == "UNLIMITED") {
        formData[item] = "10000000";
      }
    });

    this.apiService.setUserPlanAdditionLog({
      UserId: Number(this.authService.getUserSingleDetail("UserId")),
      LogType: "Plan Creation",
      Log: JSON.stringify(formData)
    }).subscribe();

    return this.http.post<any>(this.apiPath + 'api/addplan', formData);
  }

  getAllUser() {
    return this.http.get<any>(this.apiPath + "api/getAllUserList");
  }
//add -- update
  addPortalUser(data:any, isItDirect:boolean=false) {
    const actionType = data.ActionType;
    delete data.ActionType;
    data["Email"] = (<string>data["Email"]).toLowerCase();//making Email into lower case
    ["Searches", "Downloads", "WSSLimit", "Workspace"].forEach(item => {
      if(data.hasOwnProperty(item) && data[item] == "UNLIMITED") { data[item] = "10000000"; }
    });

    if(!isItDirect) {
      this.apiService.setUserPlanAdditionLog({
        UserId: Number(this.authService.getUserSingleDetail("UserId")),
        LogType: `User Creation(${actionType})`,
        Log: JSON.stringify(data)
      }).subscribe();
    }

    return this.http.post<any>(this.apiPath + `api/${actionType}UserAdmin`, data);
  }


  //get all plans
  getUserPlan() {
    return this.http.get(this.apiPath + 'api/getallplans');
  }

  //get all roles for the new user
  getAllRoles() {
    return this.http.get(this.apiPath + 'api/getAllRoles');
  }

  //get single role all access
  getRoleAccess(id:string) {
    return this.http.get(this.apiPath + 'api/getRolesAccessById?Id=' + id);
  }


  getUserDataAccess() {
    const currentUserObj = this.authService.getUserDetails();
    return currentUserObj["DataAccess"];
  }


  hasPermission() {
    const currentUserObj = this.authService.getUserDetails();
    return (["super admin", "admin"].includes(currentUserObj["RoleName"]) && ["", null].includes(currentUserObj["ParentUserId"]));
  }

  getUserRoleName() {
    const currentUserObj = this.authService.getUserDetails();
    if(["", null].includes(currentUserObj["ParentUserId"])) return currentUserObj["RoleName"];
    else return "sub user";
  }

  isUser() {
    const currentUserObj = this.authService.getUserDetails();
    return ["user"].includes(currentUserObj["RoleName"]);
  }

  //--------------user preferences-----------
  getUserPref() {
    const userPref = window.localStorage.getItem("userPref") || '{}';
    return JSON.parse(userPref);
  }

  setUserPref(key:string, value:any) {
    const userPref = this.getUserPref();
    userPref[key] = value;
    window.localStorage.setItem("userPref", JSON.stringify(userPref));
  }

  getSingleUserPref(key:string) {
    const userPref = this.getUserPref();
    return userPref[key];
  }


  //set data into bookmark storage
  setBookmarks(data:any) {
    const existData:any = this.getBookmarks();
    
    existData['data'].push(data);
    existData['ids'].push(data['RecordID']);

    window.localStorage.setItem('bookmark', JSON.stringify(existData));
  }

  getBookmarks():any {
    const storageFormat = {data: [], ids: []};
    const bookmarkedData = JSON.parse(window.localStorage.getItem('bookmark') || JSON.stringify(storageFormat));
    return bookmarkedData;
  }

  getDataExistence(id):boolean {
    const storageData = this.getBookmarks();
    return (storageData['ids'].indexOf(id))>-1;
  }

  removeBookmarkData(id) {
    const storageData = this.getBookmarks();
    const dataPos = storageData['ids'].indexOf(id);
    storageData['data'].splice(dataPos, 1);
    storageData['ids'].splice(dataPos, 1);
    window.localStorage.setItem('bookmark', JSON.stringify(storageData));
  }


  //workspace folder storage in localstorage
  async getWorkspaceFolder() {
    const workspaceData = await JSON.parse(window.localStorage.getItem("folders") || "[]");
    return workspaceData;
  }

  async setWorkspaceFolder(folderName:string) {
    const workspaceData = await this.getWorkspaceFolder();
    const objData = { folder: folderName, createdOn: new Date(), data: [] };
    workspaceData.push(objData);

    window.localStorage.setItem("folders", JSON.stringify(workspaceData));
    return "OK";
  }

  removeWorkspaceFolder() {
    window.localStorage.setItem("folders", "[]");
  }

  ///////============ user plan details for the package validity pupose =============////////
  getUserPlanDetail() {
    return this.http.get(this.apiPath + "api/getAccountDetails?UserId=" + this.authService.getUserId());
  }

 
  changePassword(data:any) {
    return this.http.post(this.apiPath + "api/changePassword", data);
  }

  userEnableDisable(data:any) {
    return this.http.post(this.apiPath + "api/enabledisableuser", data);
  }

  updateUserPereference(jsonData:string):Observable<ApiMsgRes> {
    const body = {
      Email: (this.authService.getUserDetails())["Email"],
      userPreference: jsonData
    }

    return this.http.post<ApiMsgRes>(this.apiPath + "api/updateuserpreferences", body);
  }

  getUserPreference():Observable<ApiMsgRes> {
    const userEmail = this.authService.getUserSingleDetail("Email");
    return this.http.get<ApiMsgRes>(`${this.apiPath}api/getUserPreferences?email=${userEmail}`);
  }

  getFavoriteShipment(ids:number[]):Observable<ApiMsgRes> {
    return this.http.post<ApiMsgRes>(`${this.apiPath}api/getFavoriteCompanies`, {ids});
  }
}
