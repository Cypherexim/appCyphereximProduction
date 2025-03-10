export class PlanModel {
    planLevel:string;
    planPrice:number;
    points:number;
    startFrom:number;
    searches:number;
    hasAddOn:boolean;
    recordValue:number;
}

export class UserModel {
    UserId:string = "";
    FullName:string='';
    CompanyName:string='';
    Email:string='';
    Password:string='';
    MobileNumber:string='';
    Designation:string='';
    Location:string='';
    country:string='';
    GST:string='';
    IEC:string='';
    RoleId:string='';
    RoleName:string='';
    ActionType:string='add';
    
    Share:boolean = false;
    AddUser:boolean = false
    EditUser:boolean = false;
    DeleteUser:boolean = false;
    AddPlan:boolean = false;
    EditPlan:boolean = false;
    DeletePlan:boolean = false;
    Search:boolean = false;
    EnableId:boolean = false;
    DisableId:boolean = false;
    BlockUser:boolean = false;
    UnblockUser:boolean = false;
    ClientList:boolean = false;
    PlanList:boolean = false;
    DownloadsAccess:boolean = false;
}

export class UserPlanModel {
    PlanId:string = "";
    Amount:number = 0;
    selectedPlan:string = '';
    PlanName:string = '';
    Validity:string = '';
    DataAccess:string = '';
    CountryAccess:string = '';
    Downloads:string = '';
    Searches:string = '';
    User:string='';
    CommodityAccess:string = '';
    TarrifCodeAccess:string = '';
    Workspace:string = '';
    WSSLimit:number = 0;
    StartDate:string = '';
    EndDate:string = '';
    Downloadfacility:boolean=false;
    Whatstrending:boolean=false;
    Contactdetails:boolean=false;
    Addonfacility:boolean=false; 
    Favoriteshipment:{hasFavorite:boolean, favoriteName:string} = {hasFavorite:false, favoriteName:'0'};
    Companyprofile:{hasProfile:boolean, profileName:string} = {hasProfile:false, profileName:'0'};
    Analysis:{hasAnalysis:boolean, analysisName:string} = {hasAnalysis:false, analysisName:''};
}

export class UserRoleAccess {
    Share:boolean = false;
    AddUser:boolean = false
    EditUser:boolean = false;
    DeleteUser:boolean = false;
    AddPlan:boolean = false;
    EditPlan:boolean = false;
    DeletePlan:boolean = false;
    Search:boolean = false;
    EnableId:boolean = false;
    DisableId:boolean = false;
    BlockUser:boolean = false;
    UnblockUser:boolean = false;
    ClientList:boolean = false;
    PlanList:boolean = false;
    DownloadsAccess:boolean = false;
}
