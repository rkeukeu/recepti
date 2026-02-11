import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Recipe } from '../../services/recipe';

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
    private recipeService: Recipe
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.recipeService.getRecept(this.id).subscribe({
      next: (r: any) => {
        this.model = {
          naslov: r.naslov,
          tip_jela: r.tip_jela,
          vreme_pripreme: r.vreme,
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
  save() {
    this.recipeService.updateRecept(this.id, this.model).subscribe({
      next: () => {
        alert("Recept uspešno izmenjen!");
        this.router.navigate(['/recept', this.id]);
      },
      error: (err: any) => {
        alert(err.error.msg || "Greška pri izmeni");
      }
    });
  }
}
