import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Recipe } from '../../services/recipe';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.html'
})
export class Favorites implements OnInit {
  favorites: any[] = [];

  constructor(private recipeService: Recipe) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
  this.recipeService.getOmiljeni().subscribe({
    next: (data: any) => {
      this.favorites = data;
      console.log('Omiljeni recepti:', this.favorites);
    },
    error: (err: any) => {
      console.error('Greška pri učitavanju favorita', err);
    }
  });
}

  remove(recipeId: number): void {
    // Poziva backend endpoint: POST /recepti/{id}/omiljeni (toggle)
    this.recipeService.toggleOmiljeni(recipeId).subscribe({
      next: (res: any) => {
        console.log('Response:', res);
        // Proverite da li je uspešno uklonjeno
        if (res && res.msg && res.msg.includes('uklonjen')) {
          // Uklanja recept iz liste
          this.favorites = this.favorites.filter(r => r.id !== recipeId);
          alert('Recept uklonjen iz omiljenih');
        } else {
          alert('Nije moguće ukloniti recept');
        }
      },
      error: (err: any) => {
        console.error('Greška pri uklanjanju iz favorita', err);
        alert('Greška pri uklanjanju: ' + (err.error?.msg || 'Nepoznata greška'));
      }
    });
  }
}