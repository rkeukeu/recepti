import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private apiUrl = 'http://localhost:5000/auth/favorites';

  constructor(private http: HttpClient) {}

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addToFavorites(recipeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${recipeId}`, {});
  }

  removeFromFavorites(recipeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${recipeId}`);
  }
}
