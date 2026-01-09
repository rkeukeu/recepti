import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  constructor(public router: Router) {}

  shouldShowNavbar(): boolean {
    const sakrijNaRutama = ['/login', '/registracija'];
    return !sakrijNaRutama.includes(this.router.url);
  }
}
