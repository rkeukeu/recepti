import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private apiUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  // Dobati sve omiljene recepte
  getFavorites(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<any[]>(`${this.apiUrl}/auth/favorites`, { headers });
  }

  // Ukloni iz omiljenih
  removeFromFavorites(recipeId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.apiUrl}/auth/favorites/${recipeId}`, { headers });
  }

  addToFavorites(recipeId: number): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.post(`${this.apiUrl}/auth/favorites/${recipeId}`, {}, { headers });
}

}


