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
export class LogsComponent implements OnInit {
  constructor(
    private apiService: ApiServiceService,
    private modalService: NgbModal
  ) { }

  apiSubscription1: Subscription = new Subscription();
  apiSubscription2: Subscription = new Subscription();
  apiSubscription3: Subscription = new Subscription();

  currentTable: string = "";
  logTypes: any[] = [
    { label: "search log", key: "searchLog" },
    { label: "user log", key: "userLog" },
    { label: "plan log", key: "planLog" },
    { label: "login log", key: "loginLog" }
  ];
  logsObj = { searchLog: [], userLog: [], planLog: [], loginLog: [] };
  tempLogsObj = { searchLog: [], userLog: [], planLog: [], loginLog: [] };
  tableTitle: string = "";
  searchkeyword: string = "";
  logHistoryList: any[] = [];
  copyLogHistoryList: any[] = [];
  hideAndShowPanel = (tag: any, tag2: any) => {
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
    searchLog: ["Email", "IP", "Location", "Searchcount", "Datetime"],
    userLog: ["Email", "LogType", "PlanName", "CreatedDate"],
    planLog: ["PlanName", "Validity", "DataAccess", "CreatedDate"],
    loginLog: ["IP", "Email", "Lastlogin"]
  };
  currentPage = 1;
  loading: boolean = false;

  ngOnInit(): void {
    this.getSearchHistory(1);
    this.getUserLogHistory("Plan",1);
    this.getUserLogHistory("User",1);
    this.getLoginLogHistory(1);
  }

  getSearchHistory(page: number) {
    this.loading=true;
    this.apiSubscription1 = this.apiService.getUserSearchLog(page).subscribe({
      next: (res: any) => {
        if (!res.error) {
          const result: any[] = res.results;
          this.logsObj.searchLog = result;
          this.tempLogsObj.searchLog = JSON.parse(JSON.stringify(result));
          this.loading=false;
        }
      }, error: (err: any) => {
      console.log(err);
      this.loading = false; // stop loading on error
    }
    });
  }

 getUserLogHistory(logtype: string, page: number) {
 this.loading = true;

  this.apiSubscription2 = this.apiService.getUserPlanAdditionLog(logtype, page).subscribe({
    next: (res: any) => {
      if (!res.error) {
        const result: any[] = res.results;
        const parsedResults = [];

        for (let i = 0; i < result.length; i++) {
          const jsonObj = JSON.parse(result[i]["Log"] || "{}");

          if (logtype === "Plan") {
            const { Validity, PlanName, DataAccess } = jsonObj;
            parsedResults.push({ ...result[i], Validity, PlanName, DataAccess });
          } else {
            const { Email, PlanName } = jsonObj;
            parsedResults.push({ ...result[i], Email, PlanName });
          }
        }

        
        if (logtype === "Plan") {
          this.logsObj.planLog = parsedResults;
          this.tempLogsObj.planLog = [...parsedResults]; 
        } else {
          this.logsObj.userLog = parsedResults;
          this.tempLogsObj.userLog = [...parsedResults];
        }
      }
      this.loading = false;
    },
    error: (err: any) => {
      console.log(err);
      this.loading = false; // stop loading on error
    }
  });
}


  getLoginLogHistory(page: number) {
    this.loading = true;
    this.apiSubscription3 = this.apiService.getUserLoginLog(page).subscribe({
      next: (res: any) => {
        if (!res?.error) {
          this.logsObj.loginLog = res?.results;

          this.tempLogsObj.loginLog = JSON.parse(JSON.stringify(res?.results));
         this.loading = false;
        }
      }, error: (err: any) => {
      console.log(err);
      this.loading = false; // stop loading on error
    }
    })
  }

 


  nextPage() {
    this.currentPage++;
   if (this.currentTable === 'searchLog') {
      this.getSearchHistory(this.currentPage);
    } else if (this.currentTable === 'loginLog') { 
      this.getLoginLogHistory(this.currentPage);
    } else if(this.currentTable === 'planLog') {
      this.getUserLogHistory("Plan", this.currentPage);
      
    }else if(this.currentTable === 'userLog'){
      this.getUserLogHistory("User", this.currentPage);
    }
  }

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
   if (this.currentTable === 'searchLog') {
      this.getSearchHistory(this.currentPage);
    } else if (this.currentTable === 'loginLog') {
      this.getLoginLogHistory(this.currentPage);
    } else if(this.currentTable === 'planLog') {
      this.getUserLogHistory("Plan", this.currentPage);
      
    }else if(this.currentTable === 'userLog'){
      this.getUserLogHistory("User", this.currentPage);
    }
  }
}

 showCurrentLog(key: string) {
  this.currentTable = key;
  this.currentPage = 1; // reset pagination when switching table

  this.tableTitle = key.split("L")[0];
  console.log("Current Table:", this.currentTable, "Title:", this.tableTitle);

  // fetch page 1 data for the selected table
   if (this.currentTable === 'searchLog') {
      this.getSearchHistory(this.currentPage);
    } else if (this.currentTable === 'loginLog') {
      this.getLoginLogHistory(this.currentPage);
    } else if(this.currentTable === 'planLog') {
      this.getUserLogHistory("Plan", this.currentPage);
      
    }else if(this.currentTable === 'userLog'){
      this.getUserLogHistory("User", this.currentPage);
    }
}


  showDetailModal(data: any) {
    let tempArr = [];
    const logKey = ["user", "plan"].includes(this.tableTitle) ? "Log" : this.tableTitle == "search" ? "Searchhistory" : "";
    const parsedLog = logKey != "" ? JSON.parse(data[logKey]) : {};
    const moreParsedLog = this.tableTitle == "search" ? parsedLog["body"] : {};
    const copyObj = { ...data, ...parsedLog, ...moreParsedLog };
    delete copyObj[logKey];
    delete copyObj["Id"];
    if (this.tableTitle == "search") delete copyObj["body"];

    for (let key in copyObj) {
      const temObj: any = {};
      temObj['key'] = key;
      temObj['value'] = copyObj[key];
      tempArr.push(temObj);
    }

    const modalRef = this.modalService.open(TableDataModalComponent, { windowClass: 'tableDataPopUpModalClass', centered: true });
    (<TableDataModalComponent>modalRef.componentInstance).popupName = "Log";
    (<TableDataModalComponent>modalRef.componentInstance).tableData = tempArr;
  }

  getDateFormat(dateStr: string) {
    const newDate = new Date(dateStr);
    return newDate;
  }

  onFilterBySearch() {
    // const loopLen = this.logsObj[this.currentTable].length;
    // const keys = this.tableLogkeys[this.currentTable];
    if (this.searchkeyword.length > 2) {
      this.tempLogsObj[this.currentTable] = this.logsObj[this.currentTable].filter((item: any) => Object.values(item).some((val: any) => val.includes(this.searchkeyword)));
      // console.log(this.tempLogsObj[this.currentTable])
    }
  }
}



