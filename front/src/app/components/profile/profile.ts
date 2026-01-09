import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = {};

  constructor(private authService: Auth) {}

  ngOnInit(): void {
    this.authService.getProfil().subscribe({
      next: (data) => (this.user = data),
      error: (err) => console.error('Greška pri učitavanju profila', err),
    });
  }

  sacuvaj(): void {
    this.authService.azurirajProfil(this.user).subscribe({
      next: (res) => alert('Profil uspešno ažuriran!'),
      error: (err) => alert('Greška pri čuvanju podataka.'),
    });
  }
}
