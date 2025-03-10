import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertifyService } from 'src/app/services/alertify.service';
import { UserService } from 'src/app/services/user.service';
import { ListModalComponent } from '../list-modal/list-modal.component';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit, OnDestroy {
  tableHeads:string[] = ['Executive Name', 'Downloads', 'Search', 'Designation', 'User Name', 'Edit'];
  tableSearches:string[] = ['Company Name','Plan Name','Email ID','User Name'];
  roleListType:string[] = [];
  tableData:any[] = [];
  temporaryArr:any[] = [];
  todayDate = new Date();
  copyTableData:any[] = [];
  copyTableData2:any[] = [];
  allRoles:any[] = [];
  isLoading:boolean = true;

  unlimited = {download: environment.unlimitedDownload, search: environment.unlimitedSearch};

  apiSubscription1:Subscription;
  apiSubscription2:Subscription;
  apiSubscription3:Subscription;
  apiSubscription4:Subscription;

  selectOpt:any[] = [{name:'All', val:'all'}, {name:'Expired', val:'dead'},{name:'Hot follow-up', val:'failed'},{name:'Follow-up', val:'pending'},{name:'Running', val:'success'}];
  // countColor:string = "black";

  @Output() onChangePlan:EventEmitter<any> = new EventEmitter();
  @Input() listType:string = "";

  constructor(
    private modalService: NgbModal, 
    private userService: UserService,
    private authService: AuthService,
    private alertService: AlertifyService
  ) { }

  ngOnInit(): void {
    if(this.listType == "plan") {
      this.apiSubscription1 = this.userService.getUserPlan().subscribe({
        next: (res:any) => {
          this.isLoading = false;
          if(res!=null && !res?.error && res?.results.length>0) {
            this.tableData = res?.results; 
            ["Downloads", "Searches", "Workspace", "WSSLimit"].forEach(item => this.tableData[item] = Number(this.tableData[item]));
            this.copyTableData = [...this.tableData];
          }
          }, error: (err:any) => {
            this.isLoading = false;
          }
        });
    } else {
      this.apiSubscription2 = this.userService.getAllUser().subscribe({
        next: (res:any) => {
          this.isLoading = false;
          if(res!=null && !res?.error && res?.results.length>0) {
            this.arrangeClientLists(res);

            // this.allUserSortByDays(res);
          }
        }, error: (err:any) => { this.isLoading = false; }
      });
    }

    this.apiSubscription3 = this.userService.getAllRoles().subscribe((res:any) => {
      if(!res.error) {
        this.allRoles = res?.results;
        this.roleListType = roleName=="admin" ? fewRoles : this.allRoles;
      }
    });

    const roleName = this.authService.getUserSingleDetail("RoleName");
    const fewRoles = [{RoleId: 3, RoleName: "user"}, {RoleId: 4, RoleName: "sub user"}];
  }

  ngOnDestroy(): void {
    if(this.apiSubscription1) this.apiSubscription1.unsubscribe();
    if(this.apiSubscription2) this.apiSubscription2.unsubscribe();
    if(this.apiSubscription3) this.apiSubscription3.unsubscribe();
    if(this.apiSubscription4) this.apiSubscription4.unsubscribe();
  }

  arrangeClientLists(res:any) {
    const resultArr = JSON.parse(JSON.stringify(res?.results));
    const currentUserRoleId = Number(this.authService.getUserSingleDetail("RoleId"));
    this.temporaryArr = [];

    for(let i=0; i<resultArr.length; i++) {
      if(currentUserRoleId==2) {
        if(!["",null].includes(resultArr[i]["ParentUserId"])) { 
          resultArr[i]["RoleId"] = 4;
          this.setSubUserIntoUsers(resultArr[i], resultArr);
        } else if(currentUserRoleId < Number(resultArr[i]["RoleId"])) { this.temporaryArr.push(resultArr[i]); }
      } else if(currentUserRoleId==1) { 
        this.temporaryArr.push(resultArr[i]); 
        this.setSubUserIntoUsers(resultArr[i], resultArr);
      }
    }
    
    this.tableData = [...this.temporaryArr].sort((a, b) => Number(a["RoleId"]) - Number(b["RoleId"]));
    this.copyTableData2 = JSON.parse(JSON.stringify(this.tableData));
    this.copyTableData = JSON.parse(JSON.stringify(this.copyTableData2));
  }

  setSubUserIntoUsers(subUser:any, resultArr:any[]) {
    for(let i=0; i<resultArr.length; i++) {
      if(this.temporaryArr.length!=0 && i+1 <= this.temporaryArr.length) {
        if(subUser["ParentUserId"]!=0 && subUser["ParentUserId"] == this.temporaryArr[i]["UserId"]) {
          if((this.temporaryArr[i]).hasOwnProperty("subUsers")) {(this.temporaryArr[i]["subUsers"]).push(subUser);}
          else { this.temporaryArr[i]["subUsers"] = [subUser]; }
          break;
        }
      }

      if(subUser["ParentUserId"]!=0 && subUser["ParentUserId"] == resultArr[i]["UserId"]) {
        if((resultArr[i]).hasOwnProperty("subUsers")) { (resultArr[i]["subUsers"]).push(subUser); }
        else { resultArr[i]["subUsers"] = [subUser]; }
        break;
      }
    }
  }

  allUserSortByDays(res) {
    const tempArr = JSON.parse(JSON.stringify(res?.results));
    for(let i=0; i<tempArr.length; i++) {
      const remainingDays:any = this.getUserStatus(this.todayDate, tempArr[i]["EndDate"], true);      
      tempArr[i]["index_num"] = remainingDays >= 0 ? Math.abs(remainingDays) : 0;
      
      if(i == tempArr.length-1) {
        this.tableData = [...tempArr].sort((a, b) => a["index_num"] - b["index_num"]);
        this.copyTableData = [...this.tableData];
        this.copyTableData2 = JSON.parse(JSON.stringify(this.copyTableData));
      }
    }
  }

  showMore(dataObj) {
    const data = {...dataObj};
    
    if(data.hasOwnProperty("index_num")) delete data["index_num"];

    const modalRef = this.modalService.open(ListModalComponent, {windowClass: 'tableDataPopUpModalClass'});
    (<ListModalComponent>modalRef.componentInstance).tableName = this.listType;
    (<ListModalComponent>modalRef.componentInstance).getAllHeads(data);
    (<ListModalComponent>modalRef.componentInstance).passback.subscribe((res:any) => {
      const dataObj = {type: res, data, callType: this.listType};
      
      if(res=='add') delete dataObj['data'];
      this.onChangePlan.emit(dataObj);
    });
  }

  userActiveToggle(e, data) {
    const isChecked = e.target.checked;
    const dataObj = {
      enable: isChecked,
      UserId: data["UserId"]
    };

    this.apiSubscription4 = this.userService.userEnableDisable(dataObj).subscribe((res:any) => {
      if(!res?.error && res?.message == "Ok") {
        this.alertService.success(`${data["FullName"]} is ${isChecked ? "Enabled" : "Disabled"}`);
      }
    });
  }

  getUserStatus(from:any, to:any, shouldReturnNum=false):string | number {   
    const days = this.alertService.getNumberOfDays(from, to);

    if(!shouldReturnNum) {
      if(days <= 0) return "dead";
      else if(days>0 && days<=7) return "failed";
      else if(days>7 && days<=30) return "pending";
      else return "success";
    } else return Math.ceil(days);
  }

  // getUserRole(id):string {
  //   try {
  //     console.log(this.allRoles)
  //     const role = this.allRoles.filter(item => item["RoleId"] == id)[0];
  //     return role["RoleName"];
  //   } catch (error) { console.log(error); }
  // }

  onFilterStatusWise(e:any) {
    const type = e.target.value;

    //to change total user count as per user status
    // this.countColor = type=='all'||type=='dead'?'black': type=='failed'?'red': type=='pending'?'orange':'#44d900';

    if(type == "all") {
      this.copyTableData = [...this.copyTableData2];
      return;
    }

    const tempDataArr = [];
    for(let i=0; i<this.copyTableData2.length; i++) {
      if(this.getUserStatus(this.todayDate, this.tableData[i]["EndDate"]) == type) {
        tempDataArr.push({...this.tableData[i]});
      }

      if(i == this.tableData.length-1) {
        this.copyTableData = tempDataArr;
      }
    }
  }

  onFilterSearch(e:any, type:string) {
    const filterWord = (e.target.value).toLowerCase();
    const wordLen = filterWord.length;
    const searchType = (type.split(" ")[0]).toLowerCase();
    const keys = { company: "CompanyName",email: "Email",plan: "PlanName",user: "FullName" }; 

    this.copyTableData = this.copyTableData2.filter(item => filterWord == ((item[keys[searchType]]).substring(0, wordLen)).toLowerCase());
    setTimeout(() => console.log("Filtered", this.copyTableData), 1000);
  }


  onClickArrowToggle(event:any, subUserBoxId:string) {
    const iconTag = event.target;
    const subUserTag = document.getElementById(subUserBoxId) as HTMLDivElement;
    iconTag.classList.toggle("rotate90Deg");
    subUserTag.classList.toggle("activeSubUser");
  }

  onChooseRole(event:any) {
    const role = event.target.value;    
    if(role!="") {
      if(["1","2","3"].includes(role)) this.copyTableData = this.tableData.filter(item => item["RoleId"] == role);
      else this.copyTableData = this.tableData.filter(item => (item).hasOwnProperty("subUsers"));
    } else { this.copyTableData = JSON.parse(JSON.stringify(this.tableData)); }

    this.copyTableData2 = JSON.parse(JSON.stringify(this.copyTableData));
  }
}
