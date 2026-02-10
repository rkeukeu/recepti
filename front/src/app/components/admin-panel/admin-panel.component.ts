import { Component, OnInit, OnDestroy } from '@angular/core';
<<<<<<< Updated upstream
import { CommonModule } from '@angular/common'; // DODAJTE
=======
>>>>>>> Stashed changes
import { AdminService } from '../../services/admin.service';
import { SocketService } from '../../services/socket.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
<<<<<<< Updated upstream
  selector: 'app-admin-panel',
  standalone: true, // OVO OSTAVITE
  imports: [CommonModule], // KLJUČNO!
  templateUrl: './admin-panel.component.html'
=======
  selector: 'admin-panel',
  standalone: false,
  templateUrl: './admin-panel.component.html',
>>>>>>> Stashed changes
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  korisnici: any[] = [];
  statistika: any = {};
  topAutori: any[] = [];
  noviZahtevi: any[] = [];
  ucitavanje = true;
  
  // DODAJTE OVE VARIJABLE ZA PDF
  generiseSePDF = false;
  pdfPoruka: string = '';
  pdfStatus: 'success' | 'error' | '' = '';
  poslednjiPDFurl: string = '';

  constructor(
    private adminService: AdminService,
    private socketService: SocketService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.ucitajPodatke();
    this.pretplatiNaZahteve();
<<<<<<< Updated upstream
=======
  }
  
  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
  
  pretplatiNaZahteve(): void {
    this.socketService.onNoviZahtev((zahtev: any) => {
      console.log('Novi zahtev primljen:', zahtev);
      this.noviZahtevi.unshift(zahtev);
      alert(`🆕 Novi zahtev za autora:\n${zahtev.ime}\n${zahtev.email}`);
    });
>>>>>>> Stashed changes
  }

  // METODA ZA GENERISANJE PDF IZVEŠTAJA
  preuzmiIzvestaj(): void {
    this.generiseSePDF = true;
    this.pdfPoruka = '';
    this.pdfStatus = '';
    this.poslednjiPDFurl = '';

<<<<<<< Updated upstream
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

=======
    // Interceptor će automatski dodati token!
    this.http.post(
      'http://localhost:5000/admin/generisi-izvestaj',
      {} // prazan body
    ).subscribe({
      next: (response: any) => {
        this.generiseSePDF = false;
        
        if (response.msg) {
          this.pdfPoruka = response.msg;
          this.pdfStatus = 'success';
          
          // Kreiraj link za preuzimanje PDF-a
          if (response.timestamp) {
            this.poslednjiPDFurl = `http://localhost:5000/pdfs/izvestaji/izvestaj_${response.timestamp}.pdf`;
            
            // Automatski otvori PDF u novom tabu nakon 1 sekunde
            setTimeout(() => {
              if (this.poslednjiPDFurl) {
                window.open(this.poslednjiPDFurl, '_blank');
              }
            }, 1000);
          }
        }
        
        console.log('PDF generisan:', response);
      },
      error: (error) => {
        this.generiseSePDF = false;
        
        if (error.status === 403) {
          this.pdfPoruka = 'Samo administratori mogu generisati izveštaje!';
        } else if (error.status === 401) {
          this.pdfPoruka = 'Morate biti prijavljeni!';
        } else {
          this.pdfPoruka = 'Došlo je do greške: ' + (error.error?.msg || error.message);
        }
        
        this.pdfStatus = 'error';
        console.error('Greška pri generisanju PDF:', error);
      }
    });
  }

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          
=======
>>>>>>> Stashed changes
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
    
    // Učitaj korisnike
    this.adminService.getKorisnici().subscribe({
      next: (data) => {
        this.korisnici = data;
      },
      error: (err) => console.error('Greška pri učitavanju korisnika', err)
    });

    // Učitaj statistike
    this.adminService.getStatistika().subscribe({
      next: (data) => {
        this.statistika = data;
        
        // Ako statistike dolaze u drugačijem formatu
        if (data.statistike) {
          this.statistika = data.statistike;
          this.topAutori = this.statistika.top_5_autora || [];
          
          // Formatiranje za prikaz u HTML-u
          this.statistika.ukupno_korisnika = this.statistika.korisnici?.ukupno || 0;
          this.statistika.ukupno_autora = this.statistika.korisnici?.autora || 0;
          this.statistika.ukupno_citalaca = this.statistika.korisnici?.citalaca || 0;
          this.statistika.ukupno_recepata = this.statistika.recepti?.ukupno || 0;
        }
      },
      error: (err) => console.error('Greška pri učitavanju statistike', err)
    });

    // Učitaj top autore
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

<<<<<<< Updated upstream
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
=======
  // DEBUG METODE
testAuth(): void {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('=== DEBUG AUTH ===');
  console.log('Token:', token);
  console.log('User:', user);
  
  if (token) {
    console.log('Token dužina:', token.length);
    console.log('Token početak:', token.substring(0, 20) + '...');
>>>>>>> Stashed changes
  }
  
  alert(`Token: ${token ? 'Postoji' : 'Nema'}\nUser: ${user ? 'Postoji' : 'Nema'}`);
}

proveriToken(): void {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('❌ Nema tokena u localStorage!');
    return;
  }
  
  // Proveri da li token izgleda validno
  const parts = token.split('.');
  if (parts.length !== 3) {
    alert('⚠️ Token nema validan JWT format!');
    return;
  }
  
  try {
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload);
    alert(`✅ Token validan\nSub: ${payload.sub}\nExp: ${new Date(payload.exp * 1000)}`);
  } catch (e) {
    alert('⚠️ Ne mogu dekodirati token!');
  }
}

testRuta(): void {
  console.log('Testiram /admin/statistike...');
  
  this.http.get('http://localhost:5000/admin/statistike').subscribe({
    next: (res) => {
      console.log('✅ Ruta radi:', res);
      alert('✅ Backend ruta radi!');
    },
    error: (err) => {
      console.error('❌ Ruta greška:', err);
      alert(`❌ Greška: ${err.status} - ${err.statusText}`);
    }
  });
}
}