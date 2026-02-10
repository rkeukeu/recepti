import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { AdminService } from '../../services/admin.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HttpClientModule // 👈 DODAJ OVO
  ],
  providers: [AdminService, SocketService], // 👈 DODAJ OVO
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  korisnici: any[] = [];
  statistika: any = {};
  topAutori: any[] = [];
  noviZahtevi: any[] = [];  // 👈 OVO JE ISPRAVLJENO
  emailLogs: any[] = [];
  emailStats: any = {};
  ucitavanje = true;

  constructor(
    private adminService: AdminService,
    private socketService: SocketService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('🎯 AdminPanel: ngOnInit started');
    this.ucitajPodatke();
    this.ucitajZahteve();
    this.loadEmailLogs();
    
    // Socket.IO subscription
    this.socketService.onNoviZahtev((zahtev: any) => {
      console.log('📨 Real-time zahtev:', zahtev);
      this.noviZahtevi.unshift(zahtev);
      alert(`🆕 Novi zahtev za autora:\n${zahtev.ime}\n${zahtev.email}`);
    });
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  loadEmailLogs(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get('http://localhost:5000/auth/admin/email-logs', { headers })
    .subscribe({
      next: (data: any) => {
        this.emailLogs = data.logs || [];
        this.emailStats = data.stats || {};
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju email logova', err);
      }
    });
  }

  ucitajZahteve(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get('http://localhost:5000/auth/admin/zahtevi-za-autore', { headers })
      .subscribe({
        next: (data: any) => {
          this.noviZahtevi = data;
          console.log('✅ Učitano zahteva:', this.noviZahtevi.length);
        },
        error: (err: any) => {
          console.error('Greška pri učitavanju zahteva:', err);
          this.http.get('http://localhost:5000/auth/admin/pending-requests', { headers })
            .subscribe({
              next: (oldData: any) => {
                this.noviZahtevi = oldData;
              },
              error: () => {
                this.noviZahtevi = [];
              }
            });
        }
      });
  }

  // 👈 PROMENI NAZIV OVE METODE ILI DODAJ ALIAS
  odobriAutora(zahtevId: number, email: string): void {
    if (confirm(`Odobriti zahtev korisnika ${email}?`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.post(`http://localhost:5000/auth/admin/odobri-zahtev/${zahtevId}`, {}, { headers })
        .subscribe({
          next: (res: any) => {
            alert('✅ ' + res.msg);
            this.noviZahtevi = this.noviZahtevi.filter(z => z.zahtev_id !== zahtevId);
          },
          error: (err: any) => {
            this.http.post(`http://localhost:5000/auth/admin/odobri-autora/${zahtevId}`, {}, { headers })
              .subscribe({
                next: (res2: any) => {
                  alert('✅ ' + res2.msg);
                  this.noviZahtevi = this.noviZahtevi.filter(z => z.user_id !== zahtevId);
                },
                error: (err2) => alert('❌ ' + (err2.error?.msg || 'Greška'))
              });
          }
        });
    }
  }

  odbijZahtev(zahtevId: number, email: string): void {
    const razlog = prompt(`Unesite razlog odbijanja za ${email}:`);
    
    if (razlog && razlog.trim()) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
      
      this.http.post(`http://localhost:5000/auth/admin/odbij-zahtev/${zahtevId}`, 
        { razlog: razlog }, 
        { headers }
      ).subscribe({
        next: (res: any) => {
          alert('✅ ' + res.msg);
          this.noviZahtevi = this.noviZahtevi.filter(z => z.zahtev_id !== zahtevId);
        },
        error: (err: any) => {
          this.http.post(`http://localhost:5000/auth/admin/odbij-autora/${zahtevId}`, 
            { razlog: razlog }, 
            { headers }
          ).subscribe({
            next: (res2: any) => {
              alert('✅ ' + res2.msg);
              this.noviZahtevi = this.noviZahtevi.filter(z => z.user_id !== zahtevId);
            },
            error: (err2) => alert('❌ ' + (err2.error?.msg || 'Greška'))
          });
        }
      });
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
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `izvestaj-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => console.error('Greška pri preuzimanju PDF', err)
    });
  }
}