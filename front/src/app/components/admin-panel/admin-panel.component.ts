import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
// UKLONI import { saveAs } from 'file-saver';

@Component({
  selector: 'admin-panel',
  standalone: false,
  templateUrl: './admin-panel.component.html',
})

export class AdminPanelComponent implements OnInit {
  korisnici: any[] = [];
  statistika: any = {};
  topAutori: any[] = [];
  ucitavanje = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.ucitajPodatke();
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