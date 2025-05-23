import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Interfaz junto al servicio */
export interface ConteoProducto {
  id: number;
  precioActual: number;
  cantidadEsperada: number;
  cantidadContada: number;
  conteoId: number;
  productoId: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConteoProductoService {
  private apiUrl = `${environment.apiUrl}/conteoproducto`;

  constructor(private http: HttpClient) { }

  getActiveConteoProductos(): Observable<ConteoProducto[]> {
    console.log('ConteoProductoService calling:', `${this.apiUrl}`);
    return this.http.get<ConteoProducto[]>(`${this.apiUrl}`);
  }

  getAllIncludingInactive(): Observable<ConteoProducto[]> {
    return this.http.get<ConteoProducto[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<ConteoProducto> {
    return this.http.get<ConteoProducto>(`${this.apiUrl}/${id}`);
  }

  create(item: Partial<ConteoProducto>): Observable<ConteoProducto> {
    return this.http.post<ConteoProducto>(`${this.apiUrl}`, item);
  }

  update(id: number, item: Partial<ConteoProducto>): Observable<ConteoProducto> {
    return this.http.put<ConteoProducto>(`${this.apiUrl}/${id}`, item);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
