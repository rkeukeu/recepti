import { Component, OnInit } from '@angular/core';
import { FavoritesService } from '../../services/favorites';

@Component({
  selector: 'app-favorites',
  standalone: false,
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites implements OnInit {

  favorites: any[] = [];

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (data) => {
        this.favorites = data;
      },
      error: (err) => {
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