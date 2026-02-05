import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, timer } from 'rxjs';
import { AlertifyService } from 'src/app/services/alertify.service';
import { ApiServiceService } from 'src/app/services/api-service.service';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-save-file',
  templateUrl: './save-file.component.html',
  styleUrls: ['./save-file.component.css']
})
export class SaveFileComponent implements OnInit, OnDestroy, AfterViewInit {
  isError:boolean = false;
  hasDataReceived:boolean = false;
  isAlreadySaved:boolean = false;
  errorMsg:string = 'Filename should not contain special characters except "_"';
  fileName:string = "";
  foldername:string = "default";
  folderArr:string[] = ["default"];
  targetBy:string = "";
  isAddFolderClick:boolean = false;
  saveTitle:string = "Save your changes to this file?";
  allFileNames:string[] = [];

  currentModal:string = "save-modal";
  itemList:any[] = [];
  copyItemList:any[] = [];
  totalItems:number = 0;
  searchInpt:string = "";
  listTitle:string = "";
  direction:string = "";
  filterKey:string = "";
  convertor:Function = this.alertService.valueInBillion;

  @Output() saveCallBack:EventEmitter<any> = new EventEmitter();

  // apiSubscription:Subscription = new Subscription();
  eventSubscription:Subscription = new Subscription();
  eventSubscription1:Subscription = new Subscription();
  timerSubscription:Subscription = new Subscription();

  constructor(
    public activeModal: NgbActiveModal,
    private eventService: EventemittersService,
    private apiService: ApiServiceService,
    private alertService: AlertifyService
  ) { }

  onDismissModal = () => this.activeModal.dismiss('Cross click');

  ngOnInit(): void {
    this.fileName = this.getExistFileName();
  }

  ngAfterViewInit(): void {
    if(this.currentModal=="counter-modal") this.getAllFullSideFiltersData();
    else this.getWorkspaceData();
  }

  ngOnDestroy(): void {
    // this.apiSubscription?.unsubscribe();
    this.eventSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  getExistFileName():string {
    const fileName = document.getElementById('savedFileName') as HTMLInputElement;
    return fileName.value;
  }

  getWorkspaceData() {
    // this.apiSubscription = 
    this.apiService.getWorkspace().subscribe(async(res:any) => {
      if(res!=null && !res?.error) {
        const modifiedObj = await this.alertService.getModifiedWorkspace(res?.results);
        const sortedFolderNames = modifiedObj.folderNames.sort();
        this.eventService.userWorkspaceFolders.next(sortedFolderNames);//passing given folder names
        this.folderArr = sortedFolderNames;

        (res.results).forEach((item:any) => {
          const file = JSON.parse(item.Searchbar);
          this.allFileNames.push(file['name']);
        });

        this.getExistingFolderNames();
      }
    });
  }

  getAllFullSideFiltersData() {
    this.eventSubscription1 = this.eventService.passFullSideFilterData.subscribe({
      next: (res:any) => {
        this.filterKey = this.filterKey=="Country" ? (this.direction=="export" ? "CountryofDestination":"CountryofOrigin"): this.filterKey;
        this.counterBindingData(Object.keys(res).length>0 ? res[this.filterKey]: []);
      }, error: (err:any) => console.log(err)
    });
  }

  //when the filename is given by use only in such condition we will get
  //filter modal box to select the options for filteration as well as for download purpose
  onSave(type:any) {
    const regexPattern = "[-'/`~!#*$@%+=.,^&(){}[\]|;:”<>?\\]";
    this.fileName = this.fileName.trim().replace(new RegExp(' ', 'g'), '_');
    const allCondition = [
      this.fileName=="",
      this.allFileNames.includes(this.fileName),
      (this.fileName.search(new RegExp(regexPattern)) > -1)
    ];

    
    if(allCondition[0] || allCondition[1] || allCondition[2]) {
      if(allCondition[0]) this.errorMsg = "Name field should not be empty.";
      if(allCondition[1]) this.errorMsg = 'Filename is already exist!';
      if(allCondition[2]) this.errorMsg = 'Filename should not contain special characters except "_"';
      this.isError = true;
      return;
    }

    const data = {flag: true, fileName: this.fileName, target: this.targetBy, saveType: type, foldername: this.foldername};

    this.saveCallBack.emit(data);
    this.onDismissModal();
  }

  getExistingFolderNames() {
   this.eventSubscription = this.eventService.userWorkspaceFolders.subscribe((res:any) => {
    this.folderArr = res;
    if(!this.folderArr.includes("default")) this.folderArr.unshift("default");
   }); 
  }

  toggleFolderSetting(type:string) {
    if(type == "addFolder") {
      this.isAddFolderClick = true;
      this.foldername = "";
    } else if(type == "addedFolder") {
      if(this.foldername == "") {
        const inputTag = document.getElementById("folderInput") as HTMLInputElement;
        inputTag.style.borderColor = "red";

        this.timerSubscription?.unsubscribe();
        this.timerSubscription = timer(2000).subscribe(() => {inputTag.style.borderColor = "#c2c2c2";});
      } else {
        this.folderArr.push(this.foldername);
        this.isAddFolderClick = false;
      }
    }
  }


  //table counter values modal
  counterBindingData(dataArr:any[]) {
    if(!dataArr.length) return;

    this.itemList = [...dataArr];
    this.copyItemList = JSON.parse(JSON.stringify(this.itemList));
    this.totalItems = dataArr.length;
    this.hasDataReceived = true;
  }
  onSearchItem() {
    const getKeyVal = (item:any) => item[Object.keys(item)[0]];
    const searchInput = this.searchInpt.toLowerCase();
    this.copyItemList = this.itemList.filter(item => searchInput == getKeyVal(item).toLowerCase().substring(0, searchInput.length));
  }
  selectCompany(item:any) {
    let itemVal = "";
    if(typeof item != "string") {
      const objKey = this.listTitle=="suppliers" ? "Exp_Name": "Imp_Name";
      itemVal = item[objKey];
    } else {itemVal = item;}
    
    const company = itemVal.trim();
    if(["suppliers", "buyers"].includes(this.listTitle)) {
      this.saveCallBack.emit({company});
      this.onDismissModal();
    }
  }

  getCounterVal(item:any) {
    const key = Object.keys(item)[0];
    return item[key];
  }
}
