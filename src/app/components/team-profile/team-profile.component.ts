import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-team-profile',
  templateUrl: './team-profile.component.html',
  styleUrls: ['./team-profile.component.css']
})
export class TeamProfileComponent implements OnInit {

  tableHeads:string[] = ['Executive Name', 'Downloads', 'Search', 'Designation', 'User Name', 'Edit'];
  currentScale:string = 'maximize';
  showSubUserForm:boolean = false;
  successWindow:boolean = false;
  formValues = {name: "",email: "",phone: ""};
  errorFlags:number[] = [0, 0, 0];
  userDetails:any = {};  
  numOfUsers:number = 0;
  subUserList:any[] = [];
  @Input() boxHeight:string = '75vh';
  @Output() onClickZoom:EventEmitter<string> = new EventEmitter();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private apiService: ApiServiceService
    ) { }

  ngOnInit(): void {
    this.userDetails = this.authService.getUserDetails();
    this.teamApiInit();    
  }

  teamApiInit() {
    this.userService.getUserPlanDetail().subscribe((res:any) => {
      if(!res.error && res.code == 200 && res?.results.length > 0) {//to provide values globally
        this.numOfUsers = Number(res?.results[0]["User"]);
        if(this.numOfUsers > 0) {
          this.apiService.getSubUsers().subscribe((res:any) => {
            if(!res.error) this.subUserList = res.results;
          });
        }
      }
    });
  }


  toggleZoom() {
    if(this.currentScale=='maximize') this.currentScale = 'minimize';
    else this.currentScale = 'maximize';

    this.onClickZoom.emit(this.currentScale);
  }

  onSubmitForm(e, btnError) {
    const btnTag = e.target as HTMLButtonElement;

    if(this.isFormValidated()) {
      const {CompanyName, CountryCode, UserId} = this.authService.getUserDetails();
      const {name, email, phone} = this.formValues;
      const subUserObj = {
        FullName: name,
        CompanyName: CompanyName,
        MobileNumber: phone,
        Email: email,
        ParentUserId: UserId,
        Password: email.substring(0, 5) + phone.substring(phone.length-5, phone.length),
        country: CountryCode,
        RoleId: 4
      }
      btnTag.innerText = "Submitting...";

      this.userService.userRegistration(subUserObj).subscribe({
        next: (res:any) => {
          if(!res?.error) {
            this.numOfUsers = 0;
            this.subUserList = [];
            this.successWindow = true;
            btnTag.innerText = "Submit";
            this.teamApiInit();
          } else {
            btnError.innerText = res?.message;
            btnError.style.visibility = "visible";
  
            setTimeout(() => btnError.style.visibility = "hidden", 3000);
          }
        }, error: (err:any) => { btnTag.innerText = "Submit"; }
      });
    }
  }

  isFormValidated() {
    this.errorFlags = [0,0,0];

    if(this.formValues.name.length == 0) this.errorFlags[0] = 1;

    if(this.formValues.email.length == 0) this.errorFlags[1] = 1;
    else if(!this.formValues.email.includes("@")) this.errorFlags[1] = 1;
    
    if(this.formValues.phone.length>10 
      || (this.formValues.phone.length<10 && this.formValues.phone.length>0)
      || this.formValues.phone.length == 0
    ) this.errorFlags[2] = 1;

    return !this.errorFlags.includes(1);
  }

  closePopUp() {
    this.showSubUserForm = false;
    this.successWindow = false;
    this.formValues = {name: "",email: "",phone: ""};
  }
}


