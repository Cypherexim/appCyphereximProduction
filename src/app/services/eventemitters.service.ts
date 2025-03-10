import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventemittersService {
  onLoginEvent:Subject<any> = new BehaviorSubject({});
  headerClickEvent:EventEmitter<string> = new EventEmitter();
  userStatusEvent:EventEmitter<any> = new EventEmitter();
  sidebarToggleEvent:EventEmitter<any> = new EventEmitter();
  filterSidebarEvent:EventEmitter<boolean> = new EventEmitter();
  filterModalDataEvent:EventEmitter<any> = new EventEmitter();
  saveModalEvent:EventEmitter<any> = new EventEmitter();//on click button of save model
  currentCountry:Subject<any> = new BehaviorSubject({}); //to pass choosen global country data
  savedWorkspaceEvent:Subject<any> = new BehaviorSubject({});//to pass lastSavedData to home component to start function getLastSavedData()
  confirmationEvent:Subject<boolean> = new BehaviorSubject(false); //----->>>>temporary event that will be removed soon
  setFormValues:Subject<any> = new BehaviorSubject({}); //to fill form variables
  dataTabChngEvent:Subject<boolean> = new BehaviorSubject(false);//to change the tab section of Table and Analysis
  applyFilterEvent:EventEmitter<any> = new EventEmitter();//onclick apply button to pass filter value to home component
  filterCacheMoveEvent:EventEmitter<any> = new EventEmitter(); //to pass workspace saved filter values to filter component
  passFilterDataEvent:Subject<any> = new BehaviorSubject({}); //to pass filter searched data to filter component
  refreshPageNameEvent:Subject<any> = new BehaviorSubject(""); //to refresh home page
  toggleSearchLoader:Subject<any> = new BehaviorSubject<any>({flag: false, page: "home"}); //to ON or OFF searching loader
  stopSearchingEvent:Subject<boolean> = new BehaviorSubject(false);//while stopping searching loader to stop rest of the searching events 
  updateMultiselectDropDownEvent:Subject<any> = new BehaviorSubject({});//to update multi select component
  setAnalysisDataEvent:Subject<any> = new BehaviorSubject({}); //to pass analytics query data for searching
  locatorDataMove:Subject<any> = new BehaviorSubject({}); // to move located searched data to locator component
  userDetailsStore:Subject<any> = new BehaviorSubject({}); //to pass current user details for seeking his points
  downloadListUpdate:Subject<any> = new BehaviorSubject({}); //to pass boolean to confirm if the downloading is happening out of search page after searching new query
  hasSubmittedFormAdmin:Subject<any> = new Subject(); //to send signal whether form is gonna be submitted or not 
  userAccessRights:Subject<any> = new BehaviorSubject({}); //to transfer user given rights
  vanishNotificationCount:Subject<boolean> = new BehaviorSubject(false); //to remove count from notification counter
  sendNotifications:Subject<any> = new BehaviorSubject([]);//to send notification data to other components to be received
  applyFromAnalysisData:Subject<any> = new Subject<any>(); //to search data using filter from analysis section
  hightlightDescBySidebar:Subject<string> = new Subject<string>(); //to hightlight the word using sidefilter product descriiption

  userWorkspaceFolders:Subject<string[]> = new BehaviorSubject<string[]>([]); //to transfer user created folders array
  sendChoosenWorkspace:Subject<any> = new BehaviorSubject<any>({}); //to transfer user selected workspace
  userWorkspace:Subject<string[]> = new BehaviorSubject<string[]>([]);

  companyProfileEvent:Subject<any> = new BehaviorSubject({}); //to send appropriate data towards company profile

  //whatsTrending events
  preLoginAPIsEvent:Subject<boolean> = new BehaviorSubject<boolean>(false);
  whatsTrendingEvent:Subject<number> = new Subject<number>();
  onChangeDirectionBullet:Subject<any> = new Subject<any>();

  passFullSideFilterData:Subject<any> = new BehaviorSubject<any>({});
  
  constructor() { }
}
