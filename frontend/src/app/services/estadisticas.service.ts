// src/app/services/estadisticas.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interfaces TypeScript para tipado de las respuestas.
 * Asegúrate de tener estas mismas interfaces definidas en:
 *   src/app/models/estadistica.model.ts
 */
import {
  EstadisticaProductoVendidos,
  EstadisticaProductoFaltante,
  EstadisticaProductoMenosVendidos,
  EstadisticaDineroFaltanteMes,
  EstadisticaCategoriaVendida,
  EstadisticaDineroSobranteMes
} from '../admin/estadisticas/estadisticas.model';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  private baseUrl = `${environment.apiUrl}/estadisticas`;

  constructor(private http: HttpClient) { }

  getProductosMasVendidos(fechaDesde: string, fechaHasta: string): Observable<EstadisticaProductoVendidos[]> {
    const url = `${this.baseUrl}/productos-vendidos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    return this.http.get<EstadisticaProductoVendidos[]>(url);
  }

  getProductosMasFaltaron(fechaDesde: string, fechaHasta: string): Observable<EstadisticaProductoFaltante[]> {
    const url = `${this.baseUrl}/productos-faltaron?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    return this.http.get<EstadisticaProductoFaltante[]>(url);
  }

  getProductosMenosVendidos(fechaDesde: string, fechaHasta: string): Observable<EstadisticaProductoMenosVendidos[]> {
    const url = `${this.baseUrl}/productos-menos-vendidos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    return this.http.get<EstadisticaProductoMenosVendidos[]>(url);
  }

  getDineroFaltantePorMes(anio: number): Observable<EstadisticaDineroFaltanteMes[]> {
    const params = new HttpParams().set('anio', anio.toString());
    return this.http.get<EstadisticaDineroFaltanteMes[]>(`${this.baseUrl}/dinero-faltante-mes`, { params });
  }

  getDineroSobrantePorMes(anio: number): Observable<EstadisticaDineroSobranteMes[]> {
    return this.http.get<EstadisticaDineroSobranteMes[]>(
      `${this.baseUrl}/dinero-sobrante-mes?anio=${anio}`
    );
  }

  getCategoriasMasVendidas(desde: string, hasta: string): Observable<EstadisticaCategoriaVendida[]> {
    return this.http.get<EstadisticaCategoriaVendida[]>(
      `${this.baseUrl}/categorias-vendidas?fechaDesde=${desde}&fechaHasta=${hasta}`
    );
  }

}
