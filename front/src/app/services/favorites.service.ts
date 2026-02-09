import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = 'http://localhost:5000/api'; // ILI tvoj backend URL

  constructor(private http: HttpClient) {}

  // Dobavi sve omiljene recepte
  getFavorites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/recipe/omiljeni`);
  }

  // Ukloni iz omiljenih (koristi toggle endpoint)
  removeFromFavorites(recipeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/recipe/${recipeId}/omiljeni`, {});
  }
}