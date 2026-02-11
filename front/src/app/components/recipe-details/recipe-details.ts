import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../../services/recipe';
import { FavoritesService } from '../../services/favorites.service';
import { UploadService } from '../../services/upload.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-recipe-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recipe-details.html',
  styleUrl: './recipe-details.css',
})
export class RecipeDetails implements OnInit {
  recept: any = null;
  listaSastojaka: string[] = [];

  novaOcena: number = 5;

  naslovKomentara: string = '';
  noviKomentar: string = '';
  slikaKomentaraUrl: string | null = null;

  uploading = false;
  uploadError: string | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  jeOmiljen: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private recipeService: Recipe,
    private favoritesService: FavoritesService,
    public uploadService: UploadService,
    public auth: Auth
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ucitajRecept(+id);
    }
  }

  ucitajRecept(id: number) {
    this.recipeService.getRecept(id).subscribe({
      next: (data: any) => {
        this.recept = data;

        this.favoritesService.getFavorites().subscribe({
          next: (fav: any[]) => {
            this.jeOmiljen = fav.some((r) => r.id === this.recept.id);
          },
          error: () => {},
        });

        if (this.recept.sastojci) {
          this.listaSastojaka = this.recept.sastojci
            .split(',')
            .map((s: string) => s.trim());
        }

        if (!this.recept.autor_id && this.recept.autor) {
          console.warn('autor_id nije definisan za recept');
        }
      },
      error: (err: any) => console.error('Greška pri učitavanju recepta', err),
    });
  }

  onCommentImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadError = null;

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Slika je prevelika. Maksimalna veličina je 5MB.';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'Dozvoljeni formati: JPG, PNG, GIF, WebP';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    this.uploading = true;
    this.uploadService.uploadImage(file).subscribe({
      next: (res: any) => {
        const filename = res?.filename || res?.file || res?.name;

        if (!filename) {
          this.uploadError = 'Upload je uspeo, ali nije vraćen naziv fajla.';
          this.uploading = false;
          return;
        }

        this.slikaKomentaraUrl = this.uploadService.getImageUrl(filename);
        this.uploading = false;
      },
      error: (err: any) => {
        this.uploadError = err?.error?.msg || 'Greška pri upload-u slike.';
        this.uploading = false;
      },
    });
  }

  posaljiInterakciju() {
    if (!this.recept) return;

    if (this.uploading) {
      alert('Sačekaj da se slika uploaduje.');
      return;
    }

    if (!this.naslovKomentara.trim() || !this.noviKomentar.trim()) {
      alert('Naslov i tekst komentara su obavezni.');
      return;
    }

    const payload: any = {
      vrednost: this.novaOcena,
      naslov: this.naslovKomentara.trim(),
      komentar: this.noviKomentar.trim(),
      slika: this.slikaKomentaraUrl,
    };

    this.recipeService.ostaviInterakciju(this.recept.id, payload).subscribe({
      next: () => {
        alert('Uspešno sačuvano!');

        // reset forme
        this.naslovKomentara = '';
        this.noviKomentar = '';
        this.slikaKomentaraUrl = null;
        this.imagePreview = null;
        this.uploadError = null;

        this.ucitajRecept(this.recept.id);
      },
      error: (err: any) => {
        alert(err?.error?.msg || 'Greška pri slanju komentara');
      },
    });
  }

  toggleOmiljeni() {
    if (!this.recept) return;

    if (this.jeOmiljen) {
      this.favoritesService.removeFromFavorites(this.recept.id).subscribe({
        next: () => {
          this.jeOmiljen = false;
          alert('Uklonjeno iz omiljenih');
        },
        error: (err: any) => {
          console.error(err);
          alert('Greška pri uklanjanju iz omiljenih');
        },
      });
    } else {
      this.favoritesService.addToFavorites(this.recept.id).subscribe({
        next: () => {
          this.jeOmiljen = true;
          alert('Dodato u omiljene');
        },
        error: (err: any) => {
          console.error(err);
          alert('Greška pri dodavanju u omiljene');
        },
      });
    }
  }
}
