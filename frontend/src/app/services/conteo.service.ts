import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioDto } from '../models/usuario-dto';

export interface Conteo {
  id: number;
  fechaHora: string;          // ISO date string
  conteoFinalizado: boolean;
  usuarioId: number;
  activo: boolean;
  tipoConteo: 'LIBRE' | 'CATEGORIAS';
  categoriaIds?: number[];    // Nueva propiedad para IDs de categorías
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

  createConteoLibre(conteo: Partial<Conteo>): Observable<Conteo> {
    return this.http.post<Conteo>(`${this.apiUrl}`, conteo);
  }

  createConteoCategorias(conteo: Partial<Conteo>): Observable<Conteo> {
    return this.http.post<Conteo>(`${this.apiUrl}/categorias`, conteo);
  }

  update(id: number, conteo: Partial<Conteo>): Observable<Conteo> {
    return this.http.put<Conteo>(`${this.apiUrl}/${id}`, conteo);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerTodosLosConteos(): Observable<Conteo[]> {
    return this.http.get<Conteo[]>(`${this.apiUrl}/all`);
  }

  registrarParticipante(conteoId: number, usuarioId: number): Observable<UsuarioDto> {
    const url = `${environment.apiUrl}/conteo-usuarios/conteo/${conteoId}/usuario/${usuarioId}`;
    return this.http.post<UsuarioDto>(url, {});
  }

  obtenerUsuariosPorConteo(conteoId: number): Observable<UsuarioDto[]> {
    const url = `${environment.apiUrl}/conteo-usuarios/por-conteo/${conteoId}`;
    return this.http.get<UsuarioDto[]>(url);
  }
}