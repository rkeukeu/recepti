import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  podaci = { email: '', lozinka: '' };

  constructor(private auth: Auth, private router: Router) {}

  submit() {
    this.auth.prijava(this.podaci).subscribe({
      next: () => this.router.navigate(['/recepti']),
      error: (err: any) => alert(err.error.msg),
    });
  }
}
