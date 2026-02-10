// favorites.service.ts - MODIFIKACIJA
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = 'http://localhost:5000/recepti'; // PROMENA: Koristite /recepti umesto /api

  constructor(private http: HttpClient) {}

  // Dobavi sve omiljene recepte
  getFavorites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/omiljeni`);
  }

  // Ukloni iz omiljenih (koristi toggle endpoint)
  removeFromFavorites(recipeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${recipeId}/omiljeni`, {});
  }
}