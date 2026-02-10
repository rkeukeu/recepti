import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutorService {
  private apiUrl = 'http://localhost:5000/auth/autor';

  constructor(private http: HttpClient) { }

  getAutorProfile(autorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${autorId}`);
  }

  getAutorRecepti(autorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${autorId}/recepti`);
  }
}