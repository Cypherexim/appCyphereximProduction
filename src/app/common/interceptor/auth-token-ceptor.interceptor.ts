import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {   
    if(!request.url.includes("api/signin") && !request.url.includes("api/addUserAdmin")) {
      const userDetailObj = this.authService.getUserDetails();
      if(!userDetailObj.hasOwnProperty("token")) {this.catchErrorFunc({status: 401});}
      else {
        const tokenObj = {};
        tokenObj["x-access-token"] = userDetailObj["token"];
        return next.handle(request.clone({setHeaders: tokenObj})).pipe(
          tap({
            next: this.catchErrorFunc,
            error: this.catchErrorFunc
          })
        );
      }
    } else return next.handle(request).pipe(
      tap({
        next: this.catchErrorFunc,
        error: this.catchErrorFunc
      })
    );
  }

  private catchErrorFunc(event:any) {
    if((event.status == 403 || event.status == 401)) {
      window.localStorage.setItem('currentUser', '{}');
      const logoutTag = document.getElementById("logoutAnchor") as HTMLAnchorElement;
      logoutTag.click();
    }
  }
}
