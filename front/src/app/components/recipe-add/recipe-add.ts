import { Component } from '@angular/core';
import { Recipe } from '../../services/recipe';
import { Router } from '@angular/router';

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

  constructor(private recipeService: Recipe, private router: Router) {}

  submit() {
    if (!this.noviRecept.naslov || !this.noviRecept.sastojci) {
      alert('Molimo popunite naslov i sastojke.');
      return;
    }

    this.recipeService.dodajRecept(this.noviRecept).subscribe({
      next: (res) => {
        alert('Recept je uspešno dodat!');
        this.router.navigate(['/recepti']);
      },
      error: (err) => {
        console.error(err);
        alert(
          'Greška pri dodavanju: ' + (err.error?.msg || 'Nepoznata greška')
        );
      },
    });
  }
}
