import { Component, OnDestroy } from '@angular/core';
import { ApiServiceService } from './services/api-service.service';
import { EventemittersService } from './services/eventemitters.service';
import { Subscription, interval } from 'rxjs';
import { AuthService } from './services/auth.service';
import { DownloadModelComponent } from './components/homepage/components/download-model/download-model.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'Cypher';
  idleTime = 0;
  intervalSubscription:Subscription;
  apiSubscription:Subscription;
  eventSubscription:Subscription;
  whatsTrendingDataObj:any = {
    totalValue: {}
  };
  apiCounter:number = 0;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private apiService: ApiServiceService, 
    private eventService: EventemittersService
  ) {
    //to stop printScreen
    document.addEventListener('keyup', (e) => {
      if (e.key == 'PrintScreen') {
        navigator.clipboard.writeText('');
      }
    });

    //to stop print page
    // document.addEventListener('keydown', (e) => {
    //   // || e.key == "F12"
    //   if ((e.ctrlKey && e.key == "p")) {
    //       e.preventDefault();
    //       e.stopImmediatePropagation();
    //     }
    // });

    this.startTimeoutTimer();
    this.stopBackButton();

    // Zero the idle timer on mouse movement.
    document.addEventListener("mousemove", (e) => {this.idleTime = 0;});
    document.addEventListener("keypress", (e) => {this.idleTime = 0;});

    // this.preLoginAPIsCall();
  }

  ngOnDestroy(): void {
    this.intervalSubscription?.unsubscribe();
    this.apiSubscription?.unsubscribe();
  }

  stopBackButton() {
    history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });
  }

  startTimeoutTimer() {
    this.intervalSubscription = interval(60000).subscribe(() => {
      const pathname = window.location.pathname;
      if(!["/", "/login"].includes(pathname)) {
        this.idleTime++; //Increment the idle time counter every minute.
        if (this.idleTime == 30) {
          this.intervalSubscription?.unsubscribe();
          this.showTimeoutAlert();
        }
      }
    });
  }

  showTimeoutAlert() {
    const modalRef = this.modalService.open(DownloadModelComponent, { backdrop: "static", keyboard: false, windowClass: 'timeoutClass' });
    (<DownloadModelComponent>modalRef.componentInstance).modalType = 'timeout-modal';
    const modalSub = (<DownloadModelComponent>modalRef.componentInstance).callBack.subscribe(res => {
      if(res) {
        const logoutTag = document.getElementById("logoutAnchor") as HTMLAnchorElement;
        logoutTag.click();
        this.authService.logout();
        modalSub?.unsubscribe();
      }
    });
  }
}
