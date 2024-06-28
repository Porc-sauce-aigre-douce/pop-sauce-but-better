import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HubroomComponent } from './hubroom/hubroom.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { QuizzComponent } from './quizz/quizz.component';
import { FormsModule } from '@angular/forms';
import { BackOfficeComponent } from './back-office/back-office.component';
// import { SocketIoModule } from 'ngx-socket-io';

@NgModule({
  declarations: [
    AppComponent,
    HubroomComponent,
    QuizzComponent,
    BackOfficeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
