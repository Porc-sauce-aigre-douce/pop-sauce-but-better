import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-back-office',
  templateUrl: './back-office.component.html',
  styleUrls: ['./back-office.component.css']
})
export class BackOfficeComponent {

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // this.authService.register('admin', 'admin').then((response) => {
    //   console.log(response);
    // });
    // this.authService.login('admin', 'admin', true).then((response) => {
    //   console.log(response);
    //   this.authService.getUser().then((response) => {
    //     console.log(response);
    //   });
    // });
    // this.authService.logout().then((response) => {
    //   console.log(response);
    // });
  }

}
