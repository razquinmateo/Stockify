import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Interfaz definida junto al servicio */
export interface Conteo {
  id: number;
  fechaHora: string;          // ISO date string
  conteoFinalizado: boolean;
  usuarioId: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConteoService {
  private apiUrl = `${environment.apiUrl}/conteos`;

  constructor(private http: HttpClient) { }

  getActiveConteos(): Observable<Conteo[]> {
    console.log('ConteoService calling:', `${this.apiUrl}`);
    return this.http.get<Conteo[]>(`${this.apiUrl}`);
  }

  getAllIncludingInactive(): Observable<Conteo[]> {
    return this.http.get<Conteo[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Conteo> {
    return this.http.get<Conteo>(`${this.apiUrl}/${id}`);
  }

  create(conteo: Partial<Conteo>): Observable<Conteo> {
    return this.http.post<Conteo>(`${this.apiUrl}`, conteo);
  }

  update(id: number, conteo: Partial<Conteo>): Observable<Conteo> {
    return this.http.put<Conteo>(`${this.apiUrl}/${id}`, conteo);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
