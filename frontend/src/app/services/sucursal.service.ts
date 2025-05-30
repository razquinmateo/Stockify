import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  activo: boolean;
  empresaId: number;
  nombreEmpresa?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SucursalService {
  private apiUrl = `${environment.apiUrl}/sucursales`;

  constructor(private http: HttpClient) {}

  getAllSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.apiUrl}/all`);
  }

  deshabilitarSucursal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  crearSucursal(sucursal: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, sucursal);
  }

  actualizarSucursal(id: number, sucursal: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.apiUrl}/${id}`, sucursal);
  } 

  getSucursalById(id: number): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.apiUrl}/${id}`);
  }
  
}
