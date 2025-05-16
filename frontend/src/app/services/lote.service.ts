import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lote {
  id: number;
  numeroLote: string;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  cantidadStock: number;
  activo: boolean;
  productoId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class LoteService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/lotes';

  constructor(private http: HttpClient) {}

  obtenerLotesPorSucursal(sucursalId: number): Observable<Lote[]> {
    return this.http.get<Lote[]>(`${this.apiUrl}/sucursal/${sucursalId}`);
  }

  obtenerLotesActivosPorSucursal(sucursalId: number): Observable<Lote[]> {
    return this.http.get<Lote[]>(`${this.apiUrl}/sucursal/${sucursalId}/activos`);
  }

  agregarLote(lote: Lote): Observable<Lote> {
    return this.http.post<Lote>(`${this.apiUrl}`, lote);
  }

  actualizarLote(lote: Lote): Observable<Lote> {
    return this.http.put<Lote>(`${this.apiUrl}/${lote.id}`, lote);
  }

  desactivarLote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}