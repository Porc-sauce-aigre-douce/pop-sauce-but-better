import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HubroomComponent } from './hubroom/hubroom.component';
import { QuizzComponent } from './quizz/quizz.component';
import { BackOfficeComponent } from './back-office/back-office.component';
import { isLoggedInGuard } from './guards/is-logged-in.guard';

const routes: Routes = [
  { path: '', component: HubroomComponent },
  { path: "backoffice", component: BackOfficeComponent, canActivate: [isLoggedInGuard]},
  { path: "room/:id", component: QuizzComponent},
  { path: '**', redirectTo: '' }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
