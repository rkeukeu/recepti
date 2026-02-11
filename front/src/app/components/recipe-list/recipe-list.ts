import { Router } from '@angular/router';
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

  constructor(private recipeService: Recipe, public auth: Auth, private router: Router) {}

  ngOnInit(): void {
    this.ucitajRecepte();
  }

  ucitajRecepte() {
    this.recipeService.getRecepti(this.pojamPretrage).subscribe({
      next: (data: any) => (this.recepti = data),
      error: (err: any) => console.error('Greška pri učitavanju', err),
    });
  }

  obrisi(id: number) {
    if (confirm('Da li ste sigurni da želite obrisati ovaj recept?')) {
      this.recipeService.obrisiRecept(id).subscribe({
        next: (res: any) => {
          alert('Recept je uspešno obrisan!');
          this.ucitajRecepte();
        },
        error: (err: any) => {
          alert(err.error.msg || 'Greška pri brisanju');
        },
      });
    }
  }

  openEdit(recept: any) {
    this.router.navigate(['/recept', recept.id, 'izmeni']);
  }

}
