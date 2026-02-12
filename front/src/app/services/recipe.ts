import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Recipe {
  private apiUrl = 'http://127.0.0.1:5000/recepti';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getRecepti(upit: string = ''): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pretraga?q=${upit}`);
  }

  getRecept(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  dodajRecept(podaci: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/dodaj`, podaci, {
      headers: this.getHeaders(),
    });
  }

  obrisiRecept(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  updateRecept(id: number, data: any) {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
  
      return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }
  

  ostaviInterakciju(id: number, data: any) {
    return this.http.post(
      `http://127.0.0.1:5000/recepti/${id}/interakcija`,
      data
    );
  }

  toggleOmiljeni(id: number) {
    return this.http.post(`http://127.0.0.1:5000/recepti/${id}/omiljeni`, {});
  }
  
  getOmiljeni(): Observable<any[]> {
	const headers = this.getHeaders();
	return this.http.get<any[]>('http://127.0.0.1:5000/recepti/omiljeni', { headers });
  }
}
