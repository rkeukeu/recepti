import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,  // DODAJ OVO
  imports: [CommonModule, RouterModule],  // BITNO ZA *ngIf, *ngFor, routerLink
  templateUrl: './favorites.html'
  // styleUrl: './favorites.css' // Ako postoji CSS fajl
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