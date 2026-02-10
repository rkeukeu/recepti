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
  if (confirm('Da li želite da postanete autor?\n\nMoći ćete da:\n• Postavljate recepte\n• Primajte komentare\n• Budete vidljivi drugim korisnicima')) {
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.post('http://localhost:5000/auth/postani-autor', {}, { headers })
      .subscribe({
        next: (res: any) => {
          alert('✅ ' + res.msg);
          console.log('Zahtev uspešan:', res);
        },
        error: (err: any) => {
          console.error('Greška:', err);
          alert('❌ ' + (err.error?.msg || 'Greška pri slanju zahteva'));
        }
      });
  }
}
}