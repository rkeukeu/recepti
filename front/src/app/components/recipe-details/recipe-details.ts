import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../../services/recipe';
import { FavoritesService } from '../../services/favorites.service';

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
  noviKomentar: string = '';
  jeOmiljen: boolean = false;

  constructor(private route: ActivatedRoute, private recipeService: Recipe, private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ucitajRecept(+id);
    }
  }

  ucitajRecept(id: number) {
  this.recipeService.getRecept(id).subscribe({
    next: (data) => {
      this.recept = data;
      this.favoritesService.getFavorites().subscribe({
    next: (fav: any[]) => {
    this.jeOmiljen = fav.some(r => r.id === this.recept.id);
    },
    error: () => {}
    });
      if (this.recept.sastojci) {
        this.listaSastojaka = this.recept.sastojci
          .split(',')
          .map((s: string) => s.trim());
      }
      // Proveri da li autor_id postoji
      if (!this.recept.autor_id && this.recept.autor) {
        // Ako nema autor_id, možda ga treba dobiti drugim pozivom
        console.warn('autor_id nije definisan za recept');
      }
    },
    error: (err) => console.error('Greška pri učitavanju recepta', err),
  });
}

  posaljiInterakciju() {
    if (!this.noviKomentar && !this.novaOcena) return;

    const payload = {
      vrednost: this.novaOcena,
      komentar: this.noviKomentar,
    };

    this.recipeService.ostaviInterakciju(this.recept.id, payload).subscribe({
      next: (res) => {
        alert('Uspešno ste ocenili recept!');
        this.noviKomentar = '';
        this.ucitajRecept(this.recept.id);
      },
      error: (err) => console.error('Greška pri slanju utiska', err),
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
      error: (err) => {
        console.error(err);
        alert('Greška pri uklanjanju iz omiljenih');
      }
    });
  } else {
    this.favoritesService.addToFavorites(this.recept.id).subscribe({
      next: () => {
        this.jeOmiljen = true;
        alert('Dodato u omiljene');
      },
      error: (err) => {
        console.error(err);
        alert('Greška pri dodavanju u omiljene');
      }
    });
  }
}
}
