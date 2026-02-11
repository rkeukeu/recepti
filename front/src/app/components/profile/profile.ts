import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { UploadService } from '../../services/upload.service';
import { Router } from "@angular/router";

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = {};
  uploading = false;
  uploadError = '';

  constructor(
    private authService: Auth,
    private http: HttpClient,
    private uploadService: UploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.uloga === 'administrator') {
      this.router.navigate(['/']);
      return;
    }
  
    this.authService.getProfil().subscribe({
      next: (data: any) => (this.user = data),
      error: (err: any) => console.error('Greška pri učitavanju profila', err),
    });
  }

  sacuvaj(): void {
    this.authService.azurirajProfil(this.user).subscribe({
      next: (res: any) => alert('Profil uspešno ažuriran!'),
      error: (err: any) => alert('Greška pri čuvanju podataka.'),
    });
  }

  zatraziUloguAutora() {
    if (confirm('Da li želite da pošaljete zahtev za autora?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.post('http://127.0.0.1:5000/auth/postani-autor', {}, { headers })
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

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError = '';
    this.uploading = true;

    this.uploadService.uploadImage(file).subscribe({
      next: (res: any) => {
        const filename = res?.filename || res?.file || res?.name;

        if (!filename) {
          this.uploadError = 'Upload je uspeo, ali nije vraćen naziv fajla.';
          this.uploading = false;
          return;
        }

        this.user.slika_profila = this.uploadService.getImageUrl(filename);

        this.uploading = false;
      },
      error: (err: any) => {
        this.uploadError = err?.error?.msg || 'Greška pri upload-u slike.';
        this.uploading = false;
      },
    });
  }
}
