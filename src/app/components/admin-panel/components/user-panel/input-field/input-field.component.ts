import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, EventEmitter, OnDestroy } from '@angular/core';
import {UserModel, UserPlanModel, UserRoleAccess} from 'src/app/models/plan';
import {Subscription} from 'rxjs';
import { DatePipe } from '@angular/common';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import countries from 'src/assets/CountryCodes.json';
import { AlertifyService } from 'src/app/services/alertify.service';

@Component({
  selector: 'app-input-field',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.css']
})
export class InputFieldComponent implements OnInit, OnChanges, OnDestroy {
  isPaymentReceived:boolean = false;
  hasNextClicked:boolean = false;
  paymentAmount:number = 0;
  choosenRole:string = '';
  allHsCodes:any[] = [];
  currentUserDetails:any = {};
  isDemoPlan:boolean = false;
  roleAccesses:UserRoleAccess = new UserRoleAccess();
  userFormData:UserModel = new UserModel();
  planFormData:UserPlanModel = new UserPlanModel();
  
  userCountries:any[] = countries.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
  allCountries:any[] = [];

  validity = {from: '', to: ''};
  dataAccessTime = {month: '', year: ''};
  demoDataAccess = {from: {month: '', year: ''}, to: {month: '', year: ''}};
  allYears:number[] = [];
  allRoles:any[] = [];
  allPlans:any[] = [];
  allMonths:any[] = [{name: 'january',code:'jan'},{name: 'february',code:'feb'},{name: 'march',code:'mar'},{name: 'april',code:'apr'},{name: 'may',code:'may'},{name: 'june',code:'jun'},{name: 'july',code:'jul'},{name: 'august',code:'aug'},{name: 'september',code:'sep'},{name: 'october',code:'oct'},{name: 'november',code:'nov'},{name: 'december',code:'dec'}];

  dropdownSettings = {
    key: 'Countrycode',
    value: 'CountryName',
    searchPlaceholder: 'Search Country',
    enableSelectAll: true
  }

  addUserDropSetting = {
    key: 'code',
    value: 'name',
    searchPlaceholder: 'Search Country',
    enableSelectAll: false
  }

  teriffDropdownSettings = {
    key: 'Hscode',
    value: 'Hscode',
    searchPlaceholder: 'Search HScode',
    enableSelectAll: true
  }

  analysisDropdownSettings = {
    key: 'id',
    value: 'name',
    searchPlaceholder: 'Search Analysis',
    enableSelectAll: true
  }

  allAnalysisArr:any[] = [{id: 1, name: "hscode analysis"}, {id: 2, name: "country analysis"}, {id: 3, name: "time analysis"}, {id: 4, name: "exporter analysis"}, {id: 5, name: "importer analysis"}, {id: 6, name: "customize analysis"}];

  //validation error msg variables
  contactError:string = 'contact field is required';
  emailError:string = 'email field is required';

  //these fields are mendatory to be filled
  userFormFields:string[] = ['FullName', 'CompanyName', 'Email', 'MobileNumber', 'RoleId', 'country']; //'designation', 'location', 'gst', 'iec',
  planFormFields:string[] = ['PlanName', 'Validity', 'DataAccess', 'CountryAccess', 'Downloads', 'Searches', 'CommodityAccess', 'TarrifCodeAccess', 'Workspace', 'WSSLimit', 'User'];

  toggles = {
    downloads: this.planFormData.Downloadfacility,
    favourite: this.planFormData.Favoriteshipment.hasFavorite,
    trending: this.planFormData.Whatstrending,
    profile: this.planFormData.Companyprofile.hasProfile,
    contact: this.planFormData.Contactdetails,
    facility: this.planFormData.Addonfacility,
    analysis: this.planFormData.Analysis.hasAnalysis
  };
  //in case of add more points to plan form
  addMore = { excelPoint: 0, search: 0, user: 0, workspace: 0, wssLimit: 0 };
  lastDataForUnltd={ excelPoint: 0,search: 0,workspace: 0, wssLimit: 0 };

  subscriptionEvent:Subscription;

  @Input() isEditMode:boolean = false; //wheather the current plan form is in edit mode
  @Input() hasSubmitted:boolean = false;
  @Input() currentForm:string = 'user-form';
  @Input() isOnlyForPlan:boolean = false;
  @Output() onSubmitted:EventEmitter<any> = new EventEmitter();

  constructor(
    private eventService: EventemittersService, 
    private userService: UserService,
    private aletService: AlertifyService,
    private authService: AuthService ,
    private datePipe: DatePipe
  ) {}

  //on click next button on admin panel
  ngOnChanges(changes: SimpleChanges): void {}

  onSubmitSignalChange(res) {
    if(res?.status) {
      if(this.currentForm == 'user-form') {
        if(this.userFormData['RoleName']=="" && this.userFormData.RoleId!="") {
          this.userFormData['RoleName'] = this.allRoles.filter(item => item['RoleId'] == this.userFormData.RoleId)[0]['RoleName'];
        }

        this.onClickNextBtn(this.userFormData);
      } else if(this.currentForm == 'plan-form') {
        this.setToggleBoolsToModel();
        this.onClickNextBtn(this.planFormData);
      } else {
        if(!this.isPaymentReceived) {
          const objData = {submitFlag: res?.status, amount: this.paymentAmount};
          this.onSubmitted.emit(objData);
        }
      }
    }
  }

  //to fill form variables
  ngOnInit(): void {
    this.currentUserDetails = this.authService.getUserDetails();
    if(this.currentUserDetails["RoleId"] == 3) {
      this.userFormData.RoleId = '4';
    };
    // console.log(this.currentUserDetails);

    this.eventService.hasSubmittedFormAdmin.subscribe(res => this.onSubmitSignalChange(res));

    //this is used to make form editable 
    this.subscriptionEvent = this.eventService.setFormValues.subscribe(res => {
      if(res?.type == 'plan') {
        this.setEditPlanForm(res);
      } else if(res?.type == 'user') {
        this.setEditUserForm(res?.data);
        this.setEditPlanForm(res);
      }
    });

    this.userService.getHsCode('2').subscribe(result=>{
      this.allHsCodes = result.results;
    });

    this.userService.getCountrylist().subscribe(res =>{
      const tempArr = [];
      if(!res?.error && res?.code == 200) {
        for(let i=0; i<res?.results.length; i++) {
          const isCountryAlreadyAvailable = tempArr.filter(item => item["Countrycode"] == res?.results[i]["Countrycode"]).length > 0;

          if(!isCountryAlreadyAvailable) tempArr.push(res?.results[i]);

          if(res?.results.length-1 == i) this.allCountries = tempArr;
        }
      }
    });
    
    this.userService.getAllRoles().subscribe((res:any) => {
      if(!res?.error && res?.code == 200) {
        if(this.userService.hasPermission() && !this.userService.isUser()) {
          const isUserAdmin = this.userService.getUserRoleName()=="admin";
          const exceptionArr = isUserAdmin ? ["super admin", "admin", "sub user"]: ["sub user"];
          this.allRoles = (res?.results).filter((item:any) =>  !exceptionArr.includes(item["RoleName"]));
        } else {
          this.allRoles = (res?.results).filter((item:any) => item["RoleName"] == "sub user");
        }
      }
    });

    this.userService.getUserPlan().subscribe((res:any) => {
      if(res!=null && !res?.error && res?.results.length>0) {
        this.allPlans = res?.results;       
      }
    });

    this.allYears = [];
    for(let i=2010; i<new Date().getFullYear() + 1; i++) {
      this.allYears.push(i);
    }
  }

  ngOnDestroy(): void {
    this.eventService.setFormValues.next({});
    this.subscriptionEvent.unsubscribe();
    this.removeMultiSelection();
  }

  removeMultiSelection() {
    this.eventService.updateMultiselectDropDownEvent.next({updateType: "clear", targetFrom: "admin-plan-1"});
    this.eventService.updateMultiselectDropDownEvent.next({updateType: "clear", targetFrom: "admin-plan-2"});
    this.eventService.updateMultiselectDropDownEvent.next({updateType: "clear", targetFrom: "admin-plan-3"});
    this.eventService.updateMultiselectDropDownEvent.next({updateType: "clear", targetFrom: "admin-plan-4"});
  }


  setToggleBoolsToModel() {
    this.planFormData.Downloadfacility = this.toggles.downloads;
    this.planFormData.Favoriteshipment.hasFavorite = this.toggles.favourite;
    this.planFormData.Whatstrending = this.toggles.trending;
    this.planFormData.Companyprofile.hasProfile = this.toggles.profile;
    this.planFormData.Contactdetails = this.toggles.contact;
    this.planFormData.Addonfacility = this.toggles.facility;
    this.planFormData.Analysis.hasAnalysis = this.toggles.analysis;
  }

  //onclick of next button to start submitting current form
  onClickNextBtn(formData:UserModel|UserPlanModel) {
    // if(this.validity['from'] != "" && this.validity["to"] != "" && this.currentForm == "plan-form") this.onSelectDate();
    const formFields = this.currentForm=='user-form'?this.userFormFields:this.planFormFields;
    this.hasSubmitted = this.validateForm(formData, formFields);
    const objData = {submitFlag: this.hasSubmitted, data: formData};
    
    this.onSubmitted.emit(objData);
    this.hasNextClicked = !this.hasSubmitted;
  }

  //validation function to check if the field is empty or in incorrect format
  validateForm(formData:UserModel|UserPlanModel, formFields:string[]):boolean{
    this.removeAllErrors(formFields);
    let validationFlag = true;
    
    for(let i=0; i<formFields.length; i++) {
      const value:string = formData[formFields[i]];

      if(value == '') {
        validationFlag = this.executeErrorMsg(formFields[i]);
        if(formFields[i] == 'Email') this.contactError= 'contact field is required';
        if(formFields[i] == 'MobileNumber') this.emailError = 'email field is required';
      } else if(formFields[i] == 'Email') {
        if(!value.includes('@')) { //|| !value.includes('.com')
          this.emailError = 'email is in invalid format';
          validationFlag = this.executeErrorMsg(formFields[i]);
        }
      } else if(['Downloads', 'User', 'Searches', 'Workspace', 'WSSLimit', 'MobileNumber'].includes(formFields[i])) {
        if(['Downloads', 'Searches', 'Workspace', 'WSSLimit'].includes(formFields[i]) && value == "UNLIMITED") continue;

        if(isNaN(Number(value))) validationFlag = this.executeErrorMsg(formFields[i]);
        else if(formFields[i] == 'MobileNumber' && (isNaN(Number(this.stdCodeRemover(value))) || this.stdCodeRemover(value).length<10)) {
          this.contactError = 'contact number is not valid';
          validationFlag = this.executeErrorMsg(formFields[i]);
        }
      }
      if(i == formFields.length-1) return validationFlag;
    }
  }

  stdCodeRemover(phNum:string):string {
    return (phNum.includes("+")) ? phNum.slice(1) : phNum;
  }

  executeErrorMsg(id):boolean {
    const errorTag = document.getElementById(id) as HTMLSpanElement;
    errorTag.classList.add('show-error');
    return false;
  }

  //undo all error associated input fields
  removeAllErrors(formFields:string[]) {
    for(let item of formFields) {
      const errorTag = document.getElementById(item) as HTMLSpanElement;
      errorTag.classList.remove('show-error');
    }
  }

  //once the next btn is pressed and errors are occured then based on real value 
  //error will be disappeared to the specific input field
  validateSpecificField() {
    if(this.hasNextClicked) {
      this.validateForm(
        this.currentForm=='user-form'?this.userFormData:this.planFormData,
        this.currentForm=='user-form'?this.userFormFields:this.planFormFields
      );
    }
  }

  //on switch toggle button
  onToggleBtnSwitch = (toggleName) => {
    this.toggles[toggleName] = !this.toggles[toggleName];

    if(!this.toggles[toggleName]) {
      if(toggleName == "favourite") this.planFormData.Favoriteshipment.favoriteName = "";
      if(toggleName == "profile") this.planFormData.Companyprofile.profileName = "";
      if(toggleName == "analysis") {
        this.planFormData.Analysis.analysisName = "";
        this.eventService.updateMultiselectDropDownEvent.next({ updateType: "clear", targetFrom: "admin-plan-4" });
      }
    }
    this.setToggleBoolsToModel();
  }

  //select onChange functions
  onSelectRole(e) {
    this.choosenRole = e.target.value;
    if(this.hasNextClicked) this.validateSpecificField();
  }

  //to check wheather the payment is received or not, as per this invoice btn will be there
  onPaymentChange(e) {
    if(e.target.value == 'received') {
      this.isPaymentReceived = true;
    } else {
      this.isPaymentReceived = false;
    }
  }

  getRoleAccess(e) {
    const id = e.target.value;

    if(id == '') {
      this.roleAccesses = new UserRoleAccess();
      return;
    }

    this.setAccessibleRights(id);
    this.validateSpecificField();
  }

  setAccessibleRights(id) {
    this.userService.getRoleAccess(id).subscribe((res:any) => {
      if(!res.error && res.code == 200) {
        delete res.results[0]["Id"]
        delete res.results[0]["RoleId"]
        this.roleAccesses = res.results[0];
        this.updateRoleCheckboxes({...this.roleAccesses});        
      } 
    });
  }

  //xxx-------------
  updateRoleCheckboxes(dataObj:any, callBy="direct") {
    const isDirect = callBy == "direct";
    if(isDirect && dataObj.hasOwnProperty("Downloads")) {
      dataObj["DownloadsAccess"] = dataObj["Downloads"];
      delete dataObj["Downloads"];
    }

    const keyArr = Object.keys(isDirect ? dataObj : this.roleAccesses);

    for(let i=0; i<keyArr.length; i++) {
      if(keyArr[i] != "RoleName") {    
        this.userFormData[keyArr[i]] = dataObj[keyArr[i]];
        this.roleAccesses[keyArr[i]] = dataObj[keyArr[i]];
      }
    }
  }

  onSelectDate() {
    const today = new Date();
    this.planFormData.StartDate = this.aletService.dateInFormat(today);//this.datePipe.transform(today.toLocaleDateString(), "yyyy-MM-dd");
    const timeGap = Number(this.planFormData.Validity.split(" ")[0]);
    if(!(this.planFormData.Validity).includes("days")) {
      this.planFormData.EndDate = this.aletService.dateInFormat(new Date(today.setMonth(today.getMonth() + timeGap)));
    } else {
      this.planFormData.EndDate = this.aletService.dateInFormat(new Date(today.setDate(today.getDate() + timeGap)));
    }

    // console.log(this.planFormData.StartDate, this.planFormData.EndDate);
  }

  onSelectDataAccess(isForDemo:boolean=false) {
    if(isForDemo) {
      this.planFormData.DataAccess = `${this.demoDataAccess.from.month}~${this.demoDataAccess.from.year},${this.demoDataAccess.to.month}~${this.demoDataAccess.to.year}`;
      console.log(this.planFormData.DataAccess);
    } else {
      this.planFormData.DataAccess = this.dataAccessTime.month+"~"+this.dataAccessTime.year;
    }
  }

  getMultiOptions(data:any, type) {
    if(type == "CountryAccess") this.planFormData.CountryAccess = data.toString();
    else if(type == "CommodityAccess") this.planFormData.CommodityAccess = data.toString();
    else if(type == "TarrifCodeAccess") this.planFormData.TarrifCodeAccess = data.toString();
    else if(type == "Analysis") this.planFormData.Analysis.analysisName = data.toString();    
  }


  //on Add add more value input button
  addMoreFunc(id) {
    const plusTag = document.getElementById(id) as HTMLSpanElement;
    const tag = plusTag.nextElementSibling;
    tag.classList.toggle('addmore');
    plusTag.classList.toggle('d-none');
  }
  addPoint(id) {
    const tag = document.getElementById(id) as HTMLButtonElement;
    tag.nextElementSibling.classList.toggle('addmore');
    tag.classList.toggle('d-none');

    this.planFormData[id] = Number(this.planFormData[id])+Number(this.addMore[id])+'';
    this.addMore[id] = 0;
  }

  onClickUnltd(e, key) {
    const isChecked = e.target.checked;

    if(isChecked) {
      this.lastDataForUnltd[key] = this.planFormData[key];
      this.planFormData[key] = "";
    } else this.planFormData[key] = this.lastDataForUnltd[key];

    const inputVal = e.target.nextElementSibling.value;
    this.lastDataForUnltd[key] = inputVal!='UNLIMITED'? inputVal : this.lastDataForUnltd[key];
    e.target.nextElementSibling.value = isChecked ? "UNLIMITED" : this.lastDataForUnltd[key];
    e.target.nextElementSibling.style.opacity = isChecked ?"0.5":"1";
    if(!this.isEditMode) e.target.nextElementSibling.disabled = isChecked;
   
    if(e.target.nextElementSibling.nextElementSibling) {
      e.target.nextElementSibling.nextElementSibling.style.opacity = isChecked ?"0.5":"1";
      e.target.nextElementSibling.nextElementSibling.style.pointerEvents = isChecked ?"none":"all";
    }

    // this.planFormData[key] =  isChecked ? "UNLIMITED" : new UserPlanModel()[key];
  }

  monthDiff(fromD, toD) {
    const d1 = new Date(fromD);
    const d2 = new Date(toD);
    let months = 0;

    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
  }

  setTogglesBool(){
    this.toggles = {
      downloads: this.planFormData.Downloadfacility,
      favourite: this.planFormData.Favoriteshipment.hasFavorite,
      trending: this.planFormData.Whatstrending,
      profile: this.planFormData.Companyprofile.hasProfile,
      contact: this.planFormData.Contactdetails,
      facility: this.planFormData.Addonfacility,
      analysis: this.planFormData.Analysis.hasAnalysis
    };
  }

  settingBoolData(data) {
    const conditionCheck = [null, ""];
    this.planFormData.Favoriteshipment.hasFavorite = conditionCheck.includes(data.Favoriteshipment) ? false : true;
    this.planFormData.Favoriteshipment.favoriteName = conditionCheck.includes(data.Favoriteshipment) ? "" : data.Favoriteshipment;

    this.planFormData.Companyprofile.hasProfile = conditionCheck.includes(data.Companyprofile) ? false : true;
    this.planFormData.Companyprofile.profileName = conditionCheck.includes(data.Companyprofile) ? "" : data.Companyprofile;
    
    this.planFormData.Analysis.hasAnalysis = conditionCheck.includes(data.Analysis) ? false : true;
    this.planFormData.Analysis.analysisName = conditionCheck.includes(data.Analysis) ? "" : data.Analysis;
  }

  //to fill specific toggle options if the value exist then toggle will be true or vice-versa
  setEditPlanForm(res) {
    this.isDemoPlan = ((res?.data["PlanName"]).toUpperCase()).includes("DEMO");
    // if(this.isDemoPlan) {
    const validityArr = res?.data.DataAccess.split(",");
    if(res?.data.Validity.includes("7 days") || this.isDemoPlan) {
      this.demoDataAccess.from.month = validityArr[0].split('~')[0];
      this.demoDataAccess.from.year = validityArr[0].split('~')[1];
      this.demoDataAccess.to.month = validityArr[1].split('~')[0];
      this.demoDataAccess.to.year = validityArr[1].split('~')[1];
    } else {
      this.dataAccessTime.month = validityArr[0].split('~')[0];
      this.dataAccessTime.year = validityArr[0].split('~')[1];
    }
    
    this.planFormData["Validity"] = res?.data.Validity;
    this.planFormData.StartDate = this.aletService.dateInFormat(res?.data.StartDate);
    this.planFormData.EndDate = this.aletService.dateInFormat(res?.data.EndDate);

    //temporirly

    // if(this.isOnlyForPlan) this.planFormData["Validity"] = res?.data.Validity;
    // else {
    //   this.validity.from = res?.data.Validity.split('~')[0];
    //   this.validity.to = res?.data.Validity.split('~')[1];
    // }

    this.settingBoolData(res?.data);
   
    const allKeys = ["PlanId", "User", "Amount", "selectedPlan", "PlanName", "DataAccess", "CountryAccess", "Downloads", "Searches", "CommodityAccess", "TarrifCodeAccess", "Workspace", "WSSLimit", "Downloadfacility", "Whatstrending", "Contactdetails", "Addonfacility"];
    allKeys.forEach(key => {
      if(["Downloadfacility", "Whatstrending", "Contactdetails", "Addonfacility"].includes(key)) {
        this.planFormData[key] = res?.data[key]=="false" ? false : true;
      } else this.planFormData[key] = res?.data[key];
    });

    setTimeout(() => {
      if(res?.data.CountryAccess!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-1', items: res?.data.CountryAccess.split(',')}); //for country selection
      if(res?.data.CommodityAccess!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-2', items: res?.data.CommodityAccess.split(',')}); //for commodityAccess selection
      if(res?.data.TarrifCodeAccess!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-3', items: res?.data.TarrifCodeAccess.split(',')}); //for tariffcode selection
      if(res?.data.Analysis!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-4', items: res?.data.Analysis.split(',')}); //for tariffcode selection
    }, 3000);
    this.setTogglesBool();
  }

  setEditUserForm(data) {
    const headArr = Object.keys(this.userFormData);
    headArr.push("UserId");
    headArr.forEach(key => {
      if(data[key]) {
        this.userFormData[key] = key=="MobileNumber" ? data[key]+"" : data[key];
      }
    });
    this.userFormData.ActionType = "update";
    this.updateRoleCheckboxes({...data}, "editUser")
  }

  getFormTypeBool(e) {
    const value:string = e.target.value;
    if(value.toLowerCase().includes('demo')) this.isDemoPlan = true;
    else this.isDemoPlan = false;
  }

  setEditForm() {
    const choosenPlan = this.allPlans.filter(item => this.planFormData.PlanId == item["PlanId"])[0];
    this.demoDataAccess = {from: {month: '', year: ''}, to: {month: '', year: ''}};
    this.isDemoPlan = (choosenPlan["PlanName"]).toLowerCase().includes("demo");
    
    const allKeys = ["PlanId", "PlanName", "Validity", "DataAccess", "Downloads", "Searches", "Workspace", "WSSLimit", "User", "Downloadfacility", "Whatstrending", "Contactdetails", "Addonfacility", "CountryAccess", "CommodityAccess", "TarrifCodeAccess"];
    allKeys.forEach(key => this.planFormData[key] = choosenPlan[key]);

    this.dataAccessTime.month = (choosenPlan["DataAccess"]).split("~")[0];
    this.dataAccessTime.year = (choosenPlan["DataAccess"]).split("~")[1];
    this.onSelectDate();
    this.settingBoolData(choosenPlan);
    this.setTogglesBool();
    this.removeMultiSelection();

    setTimeout(() => {
      if(choosenPlan["CountryAccess"]!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-1', items: choosenPlan["CountryAccess"].split(',')}); //for country selection
      if(choosenPlan["CommodityAccess"]!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-2', items: choosenPlan["CommodityAccess"].split(',')}); //for commodityAccess selection
      if(choosenPlan["TarrifCodeAccess"]!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-3', items: choosenPlan["TarrifCodeAccess"].split(',')}); //for tariffcode selection
      if(choosenPlan["Analysis"]!="") this.eventService.updateMultiselectDropDownEvent.next({targetFrom: 'admin-plan-4', items: choosenPlan["Analysis"].split(',')}); //for analysis selection
    }, 3000);
  }
}

