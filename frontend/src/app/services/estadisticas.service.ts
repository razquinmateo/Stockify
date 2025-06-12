// src/app/services/estadisticas.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EstadisticaProductoFaltante,
  EstadisticaProductoSobrante,
  EstadisticaDineroFaltanteMes,
  EstadisticaDineroSobranteMes,
  EstadisticaCategoriaFaltante,
  EstadisticaCategoriaSobrante
} from '../models/estadisticas.model';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  private baseUrl = `${environment.apiUrl}/estadisticas`;

  constructor(private http: HttpClient) { }

  getProductosMasFaltaron(fechaDesde: string, fechaHasta: string, sucursalId: number): Observable<EstadisticaProductoFaltante[]> {
    const url = `${this.baseUrl}/productos-faltaron?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&sucursalId=${sucursalId}`;
    return this.http.get<EstadisticaProductoFaltante[]>(url);
  }

  getProductosConMayorSobrante(fechaDesde: string, fechaHasta: string, sucursalId: number): Observable<EstadisticaProductoSobrante[]> {
    const url = `${this.baseUrl}/productos-sobrantes?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&sucursalId=${sucursalId}`;
    return this.http.get<EstadisticaProductoSobrante[]>(url);
  }

  getDineroFaltantePorMes(anio: number, sucursalId: number): Observable<EstadisticaDineroFaltanteMes[]> {
    const params = new HttpParams()
      .set('anio', anio.toString())
      .set('sucursalId', sucursalId.toString());
    return this.http.get<EstadisticaDineroFaltanteMes[]>(`${this.baseUrl}/dinero-faltante-mes`, { params });
  }

  getDineroSobrantePorMes(anio: number, sucursalId: number): Observable<EstadisticaDineroSobranteMes[]> {
    const url = `${this.baseUrl}/dinero-sobrante-mes?anio=${anio}&sucursalId=${sucursalId}`;
    return this.http.get<EstadisticaDineroSobranteMes[]>(url);
  }

  getCategoriasConMayorFaltante(fechaDesde: string, fechaHasta: string, sucursalId: number): Observable<EstadisticaCategoriaFaltante[]> {
    const url = `${this.baseUrl}/categorias-faltantes?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&sucursalId=${sucursalId}`;
    return this.http.get<EstadisticaCategoriaFaltante[]>(url);
  }

  getCategoriasConMayorSobrante(fechaDesde: string, fechaHasta: string, sucursalId: number): Observable<EstadisticaCategoriaSobrante[]> {
    const url = `${this.baseUrl}/categorias-sobrantes?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&sucursalId=${sucursalId}`;
    return this.http.get<EstadisticaCategoriaSobrante[]>(url);
  }
}