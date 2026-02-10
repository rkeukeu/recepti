import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' 
})
export class AdminService {
  private apiUrl = 'http://127.0.0.1:5000/auth/admin';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Vrati sve korisnike
  getKorisnici(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/korisnici`, { headers: this.getHeaders() });
  }

  // Obriši korisnika
  obrisiKorisnika(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/korisnici/${id}`, { headers: this.getHeaders() });
  }

  // Statistika
  getStatistika(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistika`, { headers: this.getHeaders() });
  }

  // Top 5 autora
  getTopAutori(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/top-autori`, { headers: this.getHeaders() });
  }

  // Generiši PDF izveštaj
  generisiIzvestaj(): Observable<Blob> {
  const headers = this.getHeaders().set('Accept', 'application/pdf');
  return this.http.get('http://localhost:5000/admin/generisi-izvestaj', { 
    headers: headers, 
    responseType: 'blob' 
  });
}
}