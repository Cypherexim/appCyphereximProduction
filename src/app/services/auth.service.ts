import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Login, LoginResponse, UserModel } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public apiPath: string = environment.apiurl;
  user = new BehaviorSubject<UserModel>({});
  public currentUser: Observable<UserModel>;

  constructor(private http: HttpClient) {
  //  this.user = new BehaviorSubject<UserModel>(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    this.currentUser = this.user.asObservable();
  }
  authUser(user: Login): Observable<LoginResponse> {
    return this.http.post<any>(this.apiPath + 'api/signin', user).pipe(map((res:any) => {
      // store user details and jwt token in local storage to keep user logged in between page refreshes
      console.log('during login ==>', res);

      if(!res?.error) {
        const isUserEnable = res["results"]["Enable"];
        if(isUserEnable) {
          localStorage.setItem('currentUser', JSON.stringify(res.results));
          this.user.next(res.results);
        }
      }
      return res;
    }));
  }

  logout() {
    // remove user from local storage and set current user to null
    window.localStorage.setItem('currentUser', '{}');
    this.user.next({});
  }

  isLoggedIn(): boolean {
    let status = false;
    const user = this.getUserDetails();
    if (Object.keys(user).length>0) status = true;
    return status;
  }

  public get currentUserValue(): UserModel {
    return this.user.value;
  }

  //for the temporary occasion unless the currentUserValue() func. is understandable
  getUserDetails() {
    const jsonStringify = window.localStorage.getItem('currentUser');
    const userData = (jsonStringify==null || jsonStringify=="undefined") ? {} : JSON.parse(window.localStorage.getItem('currentUser') || '{}');
    return userData;
  }

  getUserSingleDetail(key:string) {
    const userData:any = this.getUserDetails();
    return userData[key];
  }

  updateUserPoints(data:any) {
    const userData = this.getUserDetails();
    userData["remainingdays"] = data["remainingdays"];
    userData["Searches"] = data["Searches"];
    userData["Downloads"] = data["Downloads"];

    window.localStorage.setItem("currentUser", JSON.stringify(userData));
  }

  getUserId(){
    const {UserId} = this.getUserDetails();
    return UserId;
  }
  getUserParentId(){
    const {ParentUserId} = this.getUserDetails();
    return ParentUserId;
  }

  getUserCountry() {
    const {CountryCode} = this.getUserDetails();
    return CountryCode;
  }

  isUserAdmin():boolean {
    const currentUserDetails = this.getUserDetails();
    return currentUserDetails?.RoleId != 3 && ["", null].includes(currentUserDetails["ParentUserId"]);
  }

  isUserSubuser():boolean {
    const currentUserDetails = this.getUserDetails();
    return !["", null].includes(currentUserDetails["ParentUserId"]);
  }

  setUserAccess(data:any) {
    window.localStorage.setItem("userAccess", JSON.stringify(data));
  }

  updateUserDetails(key:string, value:any) {
    const userDetails = this.getUserDetails();
    userDetails[key] = value;
    window.localStorage.setItem("currentUser", JSON.stringify(userDetails));
  }
}
