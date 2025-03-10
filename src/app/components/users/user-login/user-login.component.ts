import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Utility } from 'src/app/models/others';
import { Login } from 'src/app/models/user';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit, AfterViewInit, OnDestroy {
  email: string;
  password: string;
  currentPassIcon:string = "tab-show";
  buttonLabel = {login: 'Sign In', register: 'Sign Up'};
  isBtnClicked:boolean = false;
  timeoutVar:any = {newUser: undefined, already: undefined};
  isUserAgree:boolean = false;
  
  countrylist:any[] = new Utility().countries;
  loginError = {
    email: "It seems that you have given the wrong Email-ID, please recheck your Email-ID first!",
    password: "It seems that your password is wrong, try to recheck your password for login!",
    disableUser: "Your account is temporarily disabled, please contact to the service provider."
  }
  apiSubscription:Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private apiService: ApiServiceService,
    private router: Router,
    private datePipe: DatePipe,
    private userService: UserService,
    private alertifyService: AlertifyService,
    private eventService: EventemittersService
  ) { }
  registrationForm: FormGroup;
  userSubmitted: boolean;
  user: any;

  container:any;
  ngAfterViewInit(): void {
    this.container = document.getElementById('container');
    setTimeout(() => {
      this.container.classList.add('sign-in')
    }, 200)
  }
  toggle = () => {
    this.container.classList.toggle('sign-in')
    this.container.classList.toggle('sign-up')
  }
  
  ngOnInit() {
    if(this.authService.isLoggedIn()){
      this.router.navigate(['home']);
    }

    this.registrationForm = new FormGroup({
      name: new FormControl(null, [Validators.required]),
      companyname: new FormControl(null, [Validators.required]),
      registeremail: new FormControl(null, [Validators.required, Validators.email]),
      registerpassword: new FormControl(null, [Validators.required, Validators.minLength(8)]),
      mobilenumber: new FormControl(null, [Validators.required]),
      country: new FormControl("", [Validators.required])
    });
    // this.getCountryList();
  }

  ngOnDestroy(): void {
    this.apiSubscription.unsubscribe();
  }

  onClickEnter(e:any) {
    if(e.key=="Enter" || e.code=="Enter") {
      if(this.email != '' && this.password != '') this.login();
    }
  }

  login(){
    this.isBtnClicked = true;
    const loginRequest = new Login();
    this.buttonLabel.login = "Signing In...";
    loginRequest.Email = this.email;
    loginRequest.Password = this.password;
    this.eventService.toggleSearchLoader.next({flag: true, page: "login"});

    this.authService.authUser(loginRequest).subscribe({
      next: (result:any) => {
        if(!result.error){
          const {Enable:isUserEnable, Email, UserId} = result["results"];
          // const isUserEnable = result["results"]["Enable"];
          if(isUserEnable) {
            this.alertifyService.success("Login Successful");
            // this.eventService.userStatusEvent.emit(true);
            this.eventService.onLoginEvent.next(result);
            this.eventService.preLoginAPIsEvent.next(true);
            this.eventService.toggleSearchLoader.next({flag: false, page: "login"});
            this.router.navigate(['/home']);
            this.setUserLoginLog(UserId, Email);
          } else this.alertifyService.showPackageAlert(this.loginError.disableUser);            
        } else {
          const msg = (result.message.toLowerCase().includes("email")) ? this.loginError.email : this.loginError.password;
          this.alertifyService.showPackageAlert(msg);
        }
        this.buttonLabel.login = 'Sign In';
        this.isBtnClicked = false;
      }, error: (err) => {
        this.buttonLabel.login = 'Sign In'
        this.isBtnClicked = false;
      }
    });
  }
  
  onSignOut(){
    this.eventService.userStatusEvent.emit(false);
    this.authService.logout();
  }

  
  //------------------------------------
  // Getter methods for all form controls
  // ------------------------------------
  get name() {
    return this.registrationForm.get('name') as FormControl;
  }
  get companyname() {
    return this.registrationForm.get('companyname') as FormControl;
  }
  get registeremail() {
    return this.registrationForm.get('registeremail') as FormControl;
  }
  get registerpassword() {
    return this.registrationForm.get('registerpassword') as FormControl;
  }
  get mobilenumber() {
    return this.registrationForm.get('mobilenumber') as FormControl;
  }
  get country() {
    return this.registrationForm.get('country') as FormControl;
  }

  onSubmit(){
    this.userSubmitted = true;
    this.buttonLabel.register = 'Processing...';
    if (this.registrationForm.valid) {
      this.userService.userRegistration(this.userData()).subscribe({
        next: (result:any) => {
          if(!result.error){
          this.alertifyService.success("Registration successful.");
          this.buttonLabel.register = 'Sign Up';
          this.resetData();
          }else{ this.alertifyService.error(result.message); }
        }, error: (err:any) => { this.buttonLabel.register = 'Sign Up'; }
      });
      this.userSubmitted = false;
    }
    else { this.alertifyService.error('Kindly check all the required fields.'); }
  }

  userData(): any {
    return this.user = {
      ParentUserId: 0,
      FullName: this.name.value,
      CompanyName: this.companyname.value,
      MobileNumber: this.mobilenumber.value,
      Email: this.registeremail.value,
      Password: this.registerpassword.value,
      country: this.country.value,
      RoleId: 3
    }
  }

  resetData() {
    this.isUserAgree = false;
    this.registrationForm.patchValue({
      name: '',
      companyname: '',
      registeremail: '',
      registerpassword: '',
      mobilenumber: '',
      country: ''
    });
  }

  showPassWord(elem:any) {
    elem.type = this.currentPassIcon == "tab-show" ? "text" : "password";
    this.currentPassIcon = this.currentPassIcon == "tab-show" ? "tab-hide" : "tab-show";
  }

  linkClick(type:any) {
    if(this.timeoutVar[type]) clearTimeout(this.timeoutVar[type]);

    let imgTag:any;
    if(type == "already") {
      imgTag = document.querySelector("div.arrow-container img.right") as HTMLImageElement;
    } else {
      imgTag = document.querySelector("div.arrow-container img.left") as HTMLImageElement;
    }

    imgTag.classList.add("active");
    this.timeoutVar[type] = setTimeout(() => {
      imgTag.classList.remove("active");
    },1200);
  }

  async setUserLoginLog(userId:any, userEmail:string) {
    const response1 = await fetch("https://api.ipify.org/?format=json");
    const ipRes = await response1.json();
    const dateObj = new Date();

    const apiBody = {
      UserId: userId,
      IP: ipRes["ip"],
      Email: userEmail,
      date: this.datePipe.transform(dateObj, "MM/dd/yyyy, hh:mm a")
    };

    this.apiSubscription = this.apiService.setUserLoginLog(apiBody).subscribe({
      next: (res:any) => {
        if(!res?.error) console.log("Login Log has been added");
      }, error: (err:any) => console.log(err)
    });
  }




//////////////////////////////////////////////////////////////////////////////////
  userName: string;
  companyName: string;
  countryName:string = "";
  mobileNumber: string;
  registerEmail: string;
  registerPassword: string;
  hasSignUpClicked:boolean = false;
  dates = {startDate: "", endDate: ""};

  insertBgAnime() {
    
  }

  createNewTrialAccout() {
    const today = new Date();
    this.dates.startDate = this.alertifyService.dateInFormat(today);
    this.dates.endDate = this.alertifyService.dateInFormat(new Date(today.setDate(today.getDate() + 7)));

    this.hasSignUpClicked = true;
    const last5Digit = this.mobileNumber.slice(this.mobileNumber.length-5, this.mobileNumber.length);
    this.registerPassword = this.registerEmail.slice(0, 5) + last5Digit;

    const apiObj = {
      UserId: "",
      FullName: this.userName,
      CompanyName: this.companyName,
      Email: this.registerEmail.toLowerCase(),
      Password: this.registerPassword.toLowerCase(),
      MobileNumber: this.mobileNumber,
      Designation: "",
      Location: "",
      country: this.countryName,
      GST: "",
      IEC: "",
      RoleId: "3",
      ActionType: "add",
      Share: false,
      AddUser: true,
      EditUser: false,
      DeleteUser: false,
      AddPlan: false,
      EditPlan: false,
      DeletePlan: false,
      Search: true,
      EnableId: false,
      DisableId: false,
      BlockUser: false,
      UnblockUser: false,
      ClientList: false,
      PlanList: false,
      DownloadsAccess: true,
      PlanId: "29",
      PlanName: "DEMO@PLAN 7DAYS",
      Validity: "7 days",
      DataAccess: "oct~2022,mar~2023",
      CountryAccess: "All",
      Downloads: "0 ",
      Searches: "50",
      User: "1",
      CommodityAccess: "All",
      TarrifCodeAccess: "All",
      Workspace: "100",
      WSSLimit: "100",
      StartDate: this.dates.startDate,
      EndDate: this.dates.endDate,
      Downloadfacility: "true",
      Whatstrending: "true",
      Contactdetails: "true",
      Addonfacility: "true",
      Favoriteshipment: "0",
      Companyprofile: "0",
      Analysis: "All"
    };

    this.userService.addPortalUser(apiObj, true).subscribe({
      next: (res:any) => {
        this.hasSignUpClicked = false;
        this.alertifyService.warning("Account has been created.\nCreadentials has been sent on email");
        
        this.userName="";
        this.companyName="";
        this.countryName="";
        this.mobileNumber="";
        this.registerEmail="";
        this.registerPassword="";
        this.dates = {startDate: "", endDate: ""};
      }, error: (err:any) => {
        this.hasSignUpClicked = false;
        this.alertifyService.error(err.error.message);
      }
    });
  }
}
