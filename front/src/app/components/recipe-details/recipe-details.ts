import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Recipe } from '../../services/recipe';

@Component({
  selector: 'app-recipe-details',
  standalone: false,
  templateUrl: './recipe-details.html',
  styleUrl: './recipe-details.css',
})
export class RecipeDetails implements OnInit {
  recept: any = null;
  listaSastojaka: string[] = [];

  novaOcena: number = 5;
  noviKomentar: string = '';
  jeOmiljen: boolean = false;

  constructor(private route: ActivatedRoute, private recipeService: Recipe) {}

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
        if (this.recept.sastojci) {
          this.listaSastojaka = this.recept.sastojci
            .split(',')
            .map((s: string) => s.trim());
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
    this.recipeService.toggleOmiljeni(this.recept.id).subscribe({
      next: (res: any) => {
        this.jeOmiljen = res.dodato;
        alert(res.msg);
      },
    });
  }
}
