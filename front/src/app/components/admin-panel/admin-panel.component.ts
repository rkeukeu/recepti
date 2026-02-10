import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // DODAJTE
import { AdminService } from '../../services/admin.service';
import { SocketService } from '../../services/socket.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-admin-panel',
  standalone: true, // OVO OSTAVITE
  imports: [CommonModule], // KLJUČNO!
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  korisnici: any[] = [];
  statistika: any = {};
  topAutori: any[] = [];
  noviZahtevi: any[] = [];
  ucitavanje = true;

  constructor(
    private adminService: AdminService,
    private socketService: SocketService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.ucitajPodatke();
    this.pretplatiNaZahteve();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  pretplatiNaZahteve(): void {
    console.log('🎯 AdminPanel: pretplatiNaZahteve() called');
    
    this.socketService.onNoviZahtev((zahtev: any) => {
      console.log('🎯 AdminPanel: NOVI ZAHTEV PRIMLJEN!', zahtev);
      
      this.noviZahtevi.unshift(zahtev);
      alert(`🆕 Novi zahtev za autora:\n${zahtev.ime}\n${zahtev.email}`);
    });
  }

  loadPendingZahtevi(): void {
    setInterval(() => {
      this.http.get('http://localhost:5000/auth/admin/pending-zahtevi', {
        headers: new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`)
      }).subscribe({
        next: (data: any) => {
          this.noviZahtevi = data;
        }
      });
    }, 5000);
  }

  odobriAutora(userId: number, email: string): void {
    if (confirm(`Odobriti korisnika ${email} kao autora?`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.post(
        `http://localhost:5000/auth/admin/odobri-autora/${userId}`, 
        {}, 
        { headers }
      ).subscribe({
        next: (res: any) => {
          alert(res.msg || 'Korisnik odobren kao autor!');
          
          this.noviZahtevi = this.noviZahtevi.filter(z => z.user_id !== userId);
          this.ucitajPodatke();
        },
        error: (err: any) => {
          alert(err.error?.msg || 'Greška pri odobravanju');
        }
      });
    }
  }

  odbijZahtev(userId: number, email: string): void {
    const razlog = prompt(`Unesite razlog odbijanja zahteva za ${email}:`);
    if (razlog) {
      alert(`Zahtev odbijen. Razlog: ${razlog}`);
      this.noviZahtevi = this.noviZahtevi.filter(z => z.user_id !== userId);
    }
  }

  ucitajPodatke(): void {
    this.ucitavanje = true;
    
    this.adminService.getKorisnici().subscribe({
      next: (data: any) => {
        this.korisnici = data;
      },
      error: (err: any) => console.error('Greška pri učitavanju korisnika', err)
    });

    this.adminService.getStatistika().subscribe({
      next: (data: any) => {
        this.statistika = data;
      },
      error: (err: any) => console.error('Greška pri učitavanju statistike', err)
    });

    this.adminService.getTopAutori().subscribe({
      next: (data: any) => {
        this.topAutori = data;
        this.ucitavanje = false;
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju top autora', err);
        this.ucitavanje = false;
      }
    });
  }

  obrisiKorisnika(id: number, email: string): void {
    if (confirm(`Da li ste sigurni da želite obrisati korisnika ${email}?`)) {
      this.adminService.obrisiKorisnika(id).subscribe({
        next: (res: any) => {
          alert(res.msg || 'Korisnik uspešno obrisan');
          this.ucitajPodatke();
        },
        error: (err: any) => {
          alert(err.error?.msg || 'Greška pri brisanju korisnika');
        }
      });
    }
  }

  preuzmiIzvestaj(): void {
    this.adminService.generisiIzvestaj().subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `izvestaj-top-autori-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        alert('Greška pri generisanju PDF izveštaja');
        console.error(err);
      }
    });
  }
}