import { Component, OnInit } from '@angular/core';
import { Recipe } from '../../services/recipe';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-recipe-list',
  standalone: false,
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css',
})
export class RecipeList implements OnInit {
  recepti: any[] = [];
  pojamPretrage: string = '';

  constructor(private recipeService: Recipe, public auth: Auth) {}

  ngOnInit(): void {
    this.ucitajRecepte();
  }

  ucitajRecepte() {
    this.recipeService.getRecepti(this.pojamPretrage).subscribe({
      next: (data) => (this.recepti = data),
      error: (err) => console.error('Greška pri učitavanju', err),
    });
  }

  obrisi(id: number) {
    if (confirm('Da li ste sigurni da želite obrisati ovaj recept?')) {
      this.recipeService.obrisiRecept(id).subscribe({
        next: (res) => {
          alert('Recept je uspješno obrisan!');
          this.ucitajRecepte();
        },
        error: (err) => {
          alert(err.error.msg || 'Greška pri brisanju');
        },
      });
    }
  }
}
