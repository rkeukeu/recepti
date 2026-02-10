import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // DODAJ

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = {};

  constructor(
    private authService: Auth,
    private http: HttpClient  // DODAJ OVO
  ) {}

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

  // DODAJ OVU METODU:
  zatraziUloguAutora() {
    if (confirm('Da li želite da pošaljete zahtev za autora?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.post('http://127.0.0.1:5000/postani-autor', {}, { headers })
        .subscribe({
          next: (res: any) => {
            alert(res.msg || 'Zahtev poslat administratoru!');
          },
          error: (err: any) => {
            alert(err.error?.msg || 'Greška pri slanju zahteva');
          }
        });
    }
  }
}