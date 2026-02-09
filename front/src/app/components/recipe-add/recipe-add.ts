import { Component } from '@angular/core';
import { Recipe } from '../../services/recipe';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload.service'; // DODAJ OVO
import { HttpClient } from '@angular/common/http'; // DODAJ OVO AKO TREBA

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
    slika: '',  // OVO ĆE BITI URL POSLE UPLOADA
    oznake: '',
  };

  // DODAJ OVE PROMENLJIVE:
  imagePreview: string | ArrayBuffer | null = null;
  uploading = false;
  uploadError: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private recipeService: Recipe, 
    private router: Router,
    private uploadService: UploadService  // DODAJ OVO
  ) {}

  // DODAJ METODU ZA ODABIR SLIKE:
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Provera veličine (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Slika je prevelika. Maksimalna veličina je 5MB.';
      return;
    }

    // Provera tipa
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'Dozvoljeni formati: JPG, PNG, GIF, WebP';
      return;
    }

    this.selectedFile = file;
    this.uploadError = null;

    // Prikaži preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // MODIFIKUJ POSTOJEĆU SUBMIT METODU:
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
          this.noviRecept.slika = `http://localhost:5000${result.url}`;
          this.uploading = false;
          this.posaljiRecept(); // Pošalji recept nakon uploada
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
      next: (res) => {
        alert('Recept je uspešno dodat!');
        this.router.navigate(['/recepti']);
      },
      error: (err) => {
        console.error(err);
        alert('Greška pri dodavanju: ' + (err.error?.msg || 'Nepoznata greška'));
      },
    });
  }
}