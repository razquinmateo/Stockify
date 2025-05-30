import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Proveedor {
  id: number;
  rut: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  nombreVendedor?: string;
  activo: boolean;
  productoIds?: number[];
}

export interface SucursalProveedor {
  id?: number;
  sucursalId: number;
  proveedorId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = `${environment.apiUrl}/proveedores`;
  private sucursalProveedorApiUrl = `${environment.apiUrl}/sucursal-proveedor`;

  constructor(private http: HttpClient) {}

  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/all`);
  }

  obtenerProveedoresPorSucursal(sucursalId: number): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/sucursal/${sucursalId}`);
  }

  crearProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  linkSucursalProveedor(sucursalId: number, proveedorId: number): Observable<SucursalProveedor> {
    return this.http.post<SucursalProveedor>(
      `${this.sucursalProveedorApiUrl}/sucursal/${sucursalId}/proveedor/${proveedorId}`,
      {}
    );
  }

  actualizarProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${proveedor.id}`, proveedor);
  }

  toggleProveedorActivo(proveedorId: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${proveedorId}/activo/${activo}`, null);
  }

  getById(proveedorId: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${proveedorId}`);
  }
}