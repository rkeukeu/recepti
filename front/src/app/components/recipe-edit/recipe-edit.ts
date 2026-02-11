import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Recipe } from '../../services/recipe';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-recipe-edit',
  standalone: false,
  templateUrl: './recipe-edit.html',
  styleUrl: './recipe-edit.css',
})
export class RecipeEdit implements OnInit {

  id!: number;
  model: any = {};
  imagePreview: string | ArrayBuffer | null = null;
  uploading = false;
  uploadError: string | null = null;
  selectedFile: File | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: Recipe,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.recipeService.getRecept(this.id).subscribe({
      next: (r: any) => {
        this.model = {
          naslov: r.naslov,
          tip_jela: r.tip_jela,
          vreme_pripreme: r.vreme_pripreme,
          tezina: r.tezina,
          broj_osoba: r.broj_osoba,
          sastojci: r.sastojci,
          koraci: r.koraci,
          slika: r.slika,
          oznake: r.oznake
        };
      }
    });
  }
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
  
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  
    // Upload
    this.uploading = true;
    this.uploadService.uploadImage(file).subscribe({
      next: (res: any) => {
        const filename = res?.filename || res?.file || res?.name;
        if (!filename) {
          this.uploadError = 'Upload je uspeo, ali nije vraćen naziv fajla.';
          this.uploading = false;
          return;
        }
        this.model.slika = this.uploadService.getImageUrl(filename);
        this.uploading = false;
      },
      error: (err: any) => {
        this.uploadError = err?.error?.msg || 'Greška pri upload-u slike.';
        this.uploading = false;
      }
    });
  }
  
  save() {
    if (this.uploading) {
      alert("Sačekaj da se slika uploaduje.");
      return;
    }
  
    const payload = {
      ...this.model,
      vreme_pripreme: Number(this.model.vreme_pripreme)
    };
  
    this.recipeService.updateRecept(this.id, payload).subscribe({
      next: () => {
        alert("Recept uspešno izmenjen!");
        this.router.navigate(['/recept', this.id]);
      },
      error: (err: any) => {
        alert(err?.error?.msg || "Greška pri izmeni");
      }
    });
  }
  
}
