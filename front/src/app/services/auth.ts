import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'http://127.0.0.1:5000/auth';

  constructor(private http: HttpClient) {}

  registracija(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  prijava(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('uloga', res.uloga);
      })
    );
  }

  odjava() {
    localStorage.clear();
    window.location.href = '/login';
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get uloga(): string | null {
    return localStorage.getItem('uloga');
  }

  isAutor(): boolean {
    const uloga = localStorage.getItem('uloga');
    return uloga === 'autor' || uloga === 'administrator';
  }

  getProfil(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get('http://127.0.0.1:5000/auth/moj-profil', { headers });
  }

  azurirajProfil(podaci: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put('http://127.0.0.1:5000/auth/azuriraj-profil', podaci, {
      headers,
    });
  }
}
