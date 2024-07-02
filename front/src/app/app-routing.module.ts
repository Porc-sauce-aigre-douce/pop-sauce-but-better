import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HubroomComponent } from './hubroom/hubroom.component';
import { QuizzComponent } from './quizz/quizz.component';
import { BackOfficeComponent } from './back-office/back-office.component';
import { isLoggedInGuard } from './guards/is-logged-in.guard';
import { LogInComponent } from './log-in/log-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { isThereQuestionGuard } from './guards/is-there-question.guard';

const routes: Routes = [
  { path: '', component: HubroomComponent },
  { path: "backoffice", component: BackOfficeComponent, canActivate: [isLoggedInGuard]},
  { path: "room/:id", component: QuizzComponent, canActivate: [isThereQuestionGuard]},
  { path: "login", component: LogInComponent},
  { path: "register", component: SignUpComponent},
  { path: '**', redirectTo: '' }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
