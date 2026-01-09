import { Component } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  korisnik = {
    ime: '',
    prezime: '',
    email: '',
    lozinka: '',
    datum_rodjenja: '',
    pol: 'Muški',
    drzava: '',
    ulica: '',
    broj: '',
  };

  constructor(private auth: Auth, private router: Router) {}

  submit() {
    this.auth.registracija(this.korisnik).subscribe({
      next: (res: any) => {
        alert('Uspešna registracija! Sada se možete ulogovati.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        alert('Greška: ' + err.error.msg);
      },
    });
  }
}
