import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HubroomComponent } from './hubroom/hubroom.component';
import { QuizzComponent } from './quizz/quizz.component';

const routes: Routes = [
  { path: '', component: HubroomComponent },
  { path: 'quizz-page', component: QuizzComponent },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
