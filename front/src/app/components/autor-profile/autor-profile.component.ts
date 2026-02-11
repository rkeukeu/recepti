import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AutorService } from '../../services/autor.service';
import { UploadService } from '../../services/upload.service';


@Component({
  selector: 'app-autor-profile',
  standalone: true,  // BITNO: standalone komponenta
  imports: [CommonModule, RouterModule],  // BITNO: import za *ngIf, *ngFor, routerLink
  templateUrl: './autor-profile.component.html',
  styleUrls: ['./autor-profile.component.css']
})
export class AutorProfileComponent implements OnInit {
  autor: any = null;
  ucitavanje = true;
  greska = '';

  constructor(
    private route: ActivatedRoute,
    private autorService: AutorService,
    public uploadService: UploadService
  ) {}

  ngOnInit(): void {
    const autorId = this.route.snapshot.paramMap.get('id');
    if (autorId) {
      this.ucitajProfilAutora(+autorId);
    }
  }

  ucitajProfilAutora(id: number): void {
    this.ucitavanje = true;
    this.autorService.getAutorProfile(id).subscribe({
      next: (data) => {
        this.autor = data;
        this.ucitavanje = false;
      },
      error: (err) => {
        this.greska = err.error?.msg || 'Greška pri učitavanju profila autora';
        this.ucitavanje = false;
      }
    });
  }

  formatirajDatum(datum: string): string {
    if (!datum) return 'Nepoznato';
    return datum;
  }
}