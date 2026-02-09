import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { SocketService } from '../../services/socket.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'admin-panel',
  standalone: false,
  templateUrl: './admin-panel.component.html',
})

export class AdminPanelComponent implements OnInit {
  korisnici: any[] = [];
  statistika: any = {};
  topAutori: any[] = [];
  noviZahtevi: any[] = [];
  ucitavanje = true;

  constructor(
    private adminService: AdminService,
    private socketService: SocketService,  // DODAJ OVO
    private http: HttpClient  // DODAJ ZA ODODBRU
  ) {}
  ngOnInit(): void {
    this.ucitajPodatke();
	this.pretplatiNaZahteve();
  }
  
  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
  
  pretplatiNaZahteve(): void {
    this.socketService.onNoviZahtev((zahtev: any) => {
      console.log('Novi zahtev primljen:', zahtev);
      
      // Dodaj u listu novih zahteva
      this.noviZahtevi.unshift(zahtev);  // Dodaj na početak
      
      // Prikaži notifikaciju (opciono)
      alert(`🆕 Novi zahtev za autora:\n${zahtev.ime}\n${zahtev.email}`);
    });
  }

  // DODAJ OVU METODU ZA ODOBRENJE:
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
          
          // Ukloni iz liste zahteva
          this.noviZahtevi = this.noviZahtevi.filter(z => z.user_id !== userId);
          
          // Osveži listu korisnika
          this.ucitajPodatke();
        },
        error: (err: any) => {
          alert(err.error?.msg || 'Greška pri odobravanju');
        }
      });
    }
  }

  // DODAJ OVU METODU ZA ODBIJANJE:
  odbijZahtev(userId: number, email: string): void {
    const razlog = prompt(`Unesite razlog odbijanja zahteva za ${email}:`);
    if (razlog) {
      alert(`Zahtev odbijen. Razlog: ${razlog}`);
      this.noviZahtevi = this.noviZahtevi.filter(z => z.user_id !== userId);
      
      // OVDE MOŽEŠ DODATI SLANJE EMAIL-A SA RAZLOGOM
      // this.posaljiEmailOdbijanje(email, razlog);
    }
  }


  ucitajPodatke(): void {
    this.ucitavanje = true;
    
    this.adminService.getKorisnici().subscribe({
      next: (data) => {
        this.korisnici = data;
      },
      error: (err) => console.error('Greška pri učitavanju korisnika', err)
    });

    this.adminService.getStatistika().subscribe({
      next: (data) => {
        this.statistika = data;
      },
      error: (err) => console.error('Greška pri učitavanju statistike', err)
    });

    this.adminService.getTopAutori().subscribe({
      next: (data) => {
        this.topAutori = data;
        this.ucitavanje = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju top autora', err);
        this.ucitavanje = false;
      }
    });
  }

  obrisiKorisnika(id: number, email: string): void {
    if (confirm(`Da li ste sigurni da želite obrisati korisnika ${email}?`)) {
      this.adminService.obrisiKorisnika(id).subscribe({
        next: (res) => {
          alert(res.msg || 'Korisnik uspešno obrisan');
          this.ucitajPodatke();
        },
        error: (err) => {
          alert(err.error?.msg || 'Greška pri brisanju korisnika');
        }
      });
    }
  }

  preuzmiIzvestaj(): void {
    this.adminService.generisiIzvestaj().subscribe({
      next: (blob) => {
        // Native JavaScript download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `izvestaj-top-autori-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Greška pri generisanju PDF izveštaja');
        console.error(err);
      }
    });
  }
}