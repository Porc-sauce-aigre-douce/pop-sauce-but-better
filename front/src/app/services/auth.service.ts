import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  apiUrl = 'http://localhost:3000/';

  login(username: string, password: string, rememberMe: boolean = false) {
    return fetch(this.apiUrl + 'login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: rememberMe ? 'include' : 'same-origin',
      body: JSON.stringify({ username, password }),
    }).then((response) => response.status === 400 ? false : true);
  }

  register(username: string, password: string) {
    return fetch(this.apiUrl + 'register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    }).then((response) => response.status === 400 ? false : true);
  }

  logout() {
    return fetch(this.apiUrl + 'logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).then((response) => response.json());
  }

  getUser() {
    return fetch(this.apiUrl + 'user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).then((response) => {
      if (response.status === 401) {
        return response.json().then(() => {
          throw new Error('Unauthorized');
        });
      }
      return response.json();
    });
  }

  isLoggedIn() {
    return fetch(this.apiUrl + 'isLoggedIn', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).then((response) => {
      return response.json();
    });
  }
}
