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
  odobriZahtev(reqId: number): void {
  if (confirm(`Odobriti zahtev #${reqId}?`)) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(
      `http://127.0.0.1:5000/admin/author-requests/${reqId}/approve`,
      {},
      { headers }
    ).subscribe({
      next: (res: any) => {
        alert(res.msg || 'Zahtev odobren!');
        this.noviZahtevi = this.noviZahtevi.filter(z => z.id !== reqId);
        this.ucitajPodatke();
      },
      error: (err: any) => {
        alert(err.error?.msg || 'Greška pri odobravanju');
      }
    });
  }
}

  // DODAJ OVU METODU ZA ODBIJANJE:
  odbijZahtev(reqId: number): void {
  const razlog = prompt(`Unesite razlog odbijanja:`) || '';
  if (!razlog.trim()) return;

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.post(
    `http://127.0.0.1:5000/admin/author-requests/${reqId}/reject`,
    { reason: razlog },
    { headers }
  ).subscribe({
    next: (res: any) => {
      alert(res.msg || 'Zahtev odbijen');
      this.noviZahtevi = this.noviZahtevi.filter(z => z.id !== reqId);
    },
    error: (err: any) => {
      alert(err.error?.msg || 'Greška pri odbijanju');
    }
  });
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

    this.adminService.getAuthorRequests().subscribe({
    next: (data) => {
      this.noviZahtevi = data;
    },
    error: (err) => console.error('Greška pri učitavanju zahteva', err)
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