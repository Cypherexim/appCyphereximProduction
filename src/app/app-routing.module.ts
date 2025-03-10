import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlansComponent } from './components/page-not-found/plans.component';
import { SearchDataComponent } from './components/search-data/search-data.component';
import { UserLoginComponent } from './components/users/user-login/user-login.component';
import { HelpdeskComponent } from './components/others/helpdesk/helpdesk.component';

const routes: Routes = [
  { path: 'login', component: UserLoginComponent },
  // { path: 'download-file', component: HelpdeskComponent },
  { path: 'home', component: SearchDataComponent },
  { path: '', component: UserLoginComponent, pathMatch: 'full' },
  { path: '**', component: PlansComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }




  