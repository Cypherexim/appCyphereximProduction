import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-download-model',
  templateUrl: './download-model.component.html',
  styleUrls: ['./download-model.component.css']
})
export class DownloadModelComponent implements OnInit {

  @Output() callBack:EventEmitter<any> = new EventEmitter();
  modalType:string = 'download';
  countryData:any = {};
  allDownloadNames:string[] = [];
  downloadName:string = '';
  currentTab:string = 'wait';
  isError:boolean = false;
  fileNameError:string = 'Please provide the download filename';
  phase2Err:string = "Please click the checkbox to agree";
  numberOfRecords:number = 0;
  availablePoints:number = 0;
  remainingPoints:number = 0;
  costPoints:number = 0;
  warningMsg:string = "";

  customMsg:string = "";

  constructor(
    private activeModal: NgbActiveModal, 
    private userService: UserService,
    private apiService: ApiServiceService,
    private eventService: EventemittersService
  ) { }

  ngOnInit(): void {
    console.log('helo download');
    
    setTimeout(() => this.currentTab='phase1', 800);

    this.userService.updateUserPoints().subscribe((res:any) => {
      if(res != null && !res?.error) {
        this.availablePoints = Number(res?.results[0]?.Downloads);

        this.apiService.getCountryDownloadCost(this.countryData.code).subscribe((res:any) => {
          if(res != null && !res?.error) {
            this.costPoints = res?.results[0]?.CostPerRecord ? Number(res?.results[0]?.CostPerRecord) : 1;        
            this.remainingPoints = this.availablePoints - (this.numberOfRecords * this.costPoints);
          }
        });
      }
    });
  }

  onClickNext() {
    const regexPattern = "[-'/`~!#*$@%+=.,^&(){}[\]|;:”<>?\\]";
    const tempFileName = this.downloadName.trim().replace(new RegExp(' ', 'g'), '_');

    const conditions = [
      tempFileName == '',
      this.allDownloadNames.includes(tempFileName),
      (tempFileName.search(new RegExp(regexPattern)) > -1)
    ];
    
    if(conditions[0] || conditions[1] || conditions[2]) {
      if(conditions[0]) this.fileNameError = 'Please provide the download filename';
      if(conditions[1]) this.fileNameError = 'Filename is already exist!';
      if(conditions[2]) this.fileNameError = 'Filename should not contain special characters except "_"';
      this.isError = true;
      return;
    }
    
    this.downloadName = this.downloadName.trim().replace(new RegExp(' ', 'g'), '_');
    this.currentTab = 'phase2';
    this.isError = false;

    //if remaining points are less than the required points
    setTimeout(() => {
      if(this.remainingPoints < 0) {
        const resultSpanTag = document.getElementById("remainingResult") as HTMLSpanElement;
        resultSpanTag.classList.add("active");
      }
    }, 300);
  }

  onClickPrev() {
    this.currentTab = 'phase1';
    this.isError = false;
  }

  onClickGen(elem) {
    if(this.remainingPoints < 0) {
      this.phase2Err = "You cannot generate link due to low downloading points"
      this.isError = true;
      return;
    }

    if(elem.checked) {
      this.isError = false;
      this.callBack.emit({status:'DONE', name: this.downloadName});
      this.closeModal();
    } else {
      this.phase2Err = "Please click the checkbox to agree";
      this.isError = true;
    }
  }

  closeModal(isTimeoutAlert=false) {
    this.activeModal.dismiss('Cross click');
    if(isTimeoutAlert) this.callBack.emit(true);
  }

  getSuccessMsg():string {
    const msg = {
      downloadmsg: "Your download link has been added successfully in download queue. Please wait for the file to be downloaded.",
      passwordmsg: "Your password has been changed successfully!"
    }

    if(this.customMsg == "") return msg[this.modalType.replace("-", "")];
    else return this.customMsg;
  }

  isModalForMsg(type:string):boolean {
    return ["download-msg","password-msg", "updateDate-msg"].includes(type);
  }

  //insufficient searching and downloading points
  gotoDownload(type){
    this.eventService.headerClickEvent.emit(type);
    this.closeModal();
  }
  
}
