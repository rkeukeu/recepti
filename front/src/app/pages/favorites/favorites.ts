import { Component, OnInit } from '@angular/core';
import { FavoritesService } from '../../services/favorites.service'; // BITNO: .service na kraju!

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.html'
})
export class Favorites implements OnInit {

  favorites: any[] = [];

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (data: any) => {
        this.favorites = data;
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju favorita', err);
      }
    });
  }

  remove(recipeId: number) {
    this.favoritesService.removeFromFavorites(recipeId).subscribe(() => {
      this.favorites = this.favorites.filter(r => r.id !== recipeId);
    });
  }
}