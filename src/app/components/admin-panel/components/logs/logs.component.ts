import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { TableDataModalComponent } from 'src/app/components/homepage/components/table-data-modal/table-data-modal.component';
import { ApiServiceService } from 'src/app/services/api-service.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit{
  constructor(
    private apiService: ApiServiceService,
    private modalService: NgbModal
  ) {}

  apiSubscription1:Subscription = new Subscription();
  apiSubscription2:Subscription = new Subscription();
  apiSubscription3:Subscription = new Subscription();

  currentTable:string = "";
  logTypes:any[] = [
    {label: "search log", key: "searchLog"}, 
    {label: "user log", key: "userLog"}, 
    {label: "plan log", key: "planLog"}, 
    {label: "login log", key: "loginLog"}
  ];
  logsObj = { searchLog: [], userLog: [], planLog: [], loginLog: [] };
  tempLogsObj = { searchLog: [], userLog: [], planLog: [], loginLog: [] };
  tableTitle:string = "";
  searchkeyword:string="";
  logHistoryList:any[] = [];
  copyLogHistoryList:any[] = [];
  hideAndShowPanel = (tag:any, tag2:any) => {
    tag.classList.toggle("active");    
    tag2.classList.toggle("active");    
  }

  tableHeads = {
    searchLog: ["", "S. No.", "User Email", "User IP", "User Location", "Search Counts", "Search Date"],
    planLog: ["", "S. No.", "Plan Name", "Validity", "Data Access", "Action Time"],
    userLog: ["", "S. No.", "User Email", "Action Type", "Plan Name", "Action Time"],
    loginLog: ["S. No.", "User IP", "User Email", "Login Time"]
  };
  tableLogkeys = {
    searchLog: ["Email","IP","Location","Searchcount","Datetime"],
    userLog: ["Email","LogType","PlanName","CreatedDate"],
    planLog: ["PlanName","Validity","DataAccess","CreatedDate"],
    loginLog: ["IP","Email","Lastlogin"]
  };

  ngOnInit(): void {
    this.getSearchHistory();
    this.getUserLogHistory("Plan");
    this.getUserLogHistory("User");
    this.getLoginLogHistory();
  }

  getSearchHistory() {
    this.apiSubscription1 = this.apiService.getUserSearchLog().subscribe({
      next: (res:any) => {
        if(!res.error) {
          const result:any[] = res.results;
          this.logsObj.searchLog = result;
          this.tempLogsObj.searchLog = JSON.parse(JSON.stringify(result));
        }
      }, error: (err:any) => {console.log(err);}
    });
  }

  getUserLogHistory(logtype:string) {
    this.apiSubscription2 = this.apiService.getUserPlanAdditionLog(logtype).subscribe({
      next: (res:any) => {
        if(!res.error) {
          const result:any[] = res.results;
          const resultLen = result.length;
          if(logtype == "Plan") {
            for(let i=0; i<resultLen; i++) {
              const jsonObj = JSON.parse(result[i]["Log"]) || {};
              const {Validity, PlanName, DataAccess} = jsonObj;
              this.logsObj.planLog.push({...result[i], Validity, PlanName, DataAccess});
              this.tempLogsObj.planLog.push({...result[i], Validity, PlanName, DataAccess});
            }
          } else {
            for(let i=0; i<resultLen; i++) {
              const jsonObj = JSON.parse(result[i]["Log"]) || {};
              const {Email, PlanName} = jsonObj;
              this.logsObj.userLog.push({...result[i], Email, PlanName});
              this.tempLogsObj.userLog.push({...result[i], Email, PlanName});
            }
          }
        }
      }, error: (err:any) => console.log(err)
    });
  }

  getLoginLogHistory() {
    this.apiSubscription3 = this.apiService.getUserLoginLog().subscribe({
      next: (res:any) => {
        if(!res?.error) {
          this.logsObj.loginLog = res?.results;
          this.tempLogsObj.loginLog = JSON.parse(JSON.stringify(res?.results));
        }
      }, error: (err:any) => console.log(err)
    })
  }

  showCurrentLog(key:string) {
    this.currentTable = key;
    this.tableTitle = key.split("L")[0];
    console.log(this.currentTable, this.tableTitle, this.logsObj.loginLog.length);
  }

  showDetailModal(data:any) {
    let tempArr = [];
    const logKey = ["user","plan"].includes(this.tableTitle) ? "Log": this.tableTitle=="search" ? "Searchhistory": "";
    const parsedLog = logKey!="" ? JSON.parse(data[logKey]): {};
    const moreParsedLog = this.tableTitle=="search" ? parsedLog["body"]: {};
    const copyObj = {...data, ...parsedLog, ...moreParsedLog};
    delete copyObj[logKey];
    delete copyObj["Id"];
    if(this.tableTitle=="search") delete copyObj["body"];

    for (let key in copyObj) {
      const temObj: any = {};
      temObj['key'] = key;
      temObj['value'] = copyObj[key];
      tempArr.push(temObj);
    }

    const modalRef = this.modalService.open(TableDataModalComponent, { windowClass: 'tableDataPopUpModalClass' });
    (<TableDataModalComponent>modalRef.componentInstance).popupName = "Log";
    (<TableDataModalComponent>modalRef.componentInstance).tableData = tempArr;
  }

  getDateFormat(dateStr:string){
    const newDate = new Date(dateStr);
    return newDate;
  }

  onFilterBySearch() {    
    // const loopLen = this.logsObj[this.currentTable].length;
    // const keys = this.tableLogkeys[this.currentTable];
    if(this.searchkeyword.length>2) {
      this.tempLogsObj[this.currentTable] = this.logsObj[this.currentTable].filter((item:any) => Object.values(item).some((val:any) => val.includes(this.searchkeyword)));
    }
  }
}



