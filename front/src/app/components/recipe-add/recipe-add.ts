import { Component } from '@angular/core';
import { Recipe } from '../../services/recipe';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recipe-add',
  standalone: false,
  templateUrl: './recipe-add.html',
  styleUrl: './recipe-add.css',
})
export class RecipeAdd {
  noviRecept = {
    naslov: '',
    tip_jela: 'Glavno jelo',
    vreme_pripreme: 0,
    tezina: 'Srednje',
    broj_osoba: 1,
    sastojci: '',
    koraci: '',
    slika: '',
    oznake: '',
  };

  imagePreview: string | ArrayBuffer | null = null;
  uploading = false;
  uploadError: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private recipeService: Recipe, 
    private router: Router,
    private uploadService: UploadService
  ) {}

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Slika je prevelika. Maksimalna veličina je 5MB.';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'Dozvoljeni formati: JPG, PNG, GIF, WebP';
      return;
    }

    this.selectedFile = file;
    this.uploadError = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  submit() {
    if (!this.noviRecept.naslov || !this.noviRecept.sastojci) {
      alert('Molimo popunite naslov i sastojke.');
      return;
    }

    // Ako je izabrana slika, prvo uploaduj
    if (this.selectedFile) {
      this.uploading = true;
      this.uploadService.uploadImage(this.selectedFile).subscribe({
        next: (result: any) => {
        this.noviRecept.slika = result.filename;  
        this.uploading = false;
        this.posaljiRecept();
        },
        error: (error: any) => {
          this.uploading = false;
          this.uploadError = error.error?.msg || 'Greška pri uploadu slike';
        }
      });
    } else {
      // Ako nema slike, pošalji direktno
      this.posaljiRecept();
    }
  }

  // NOVA POMOĆNA METODA ZA SLANJE RECEPTA:
  private posaljiRecept() {
    this.recipeService.dodajRecept(this.noviRecept).subscribe({
      next: (res: any) => {
        alert('Recept je uspešno dodat!');
        this.router.navigate(['/recepti']);
      },
      error: (err: any) => {
        console.error(err);
        alert('Greška pri dodavanju: ' + (err.error?.msg || 'Nepoznata greška'));
      },
    });
  }
}