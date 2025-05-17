import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Proveedor {
  id: number;
  rut: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  nombreVendedor?: string;
  activo: boolean;
}

export interface SucursalProveedor {
  id: number;
  sucursalId: number;
  proveedorId: number;
  proveedorNombre: string;
  proveedorRut: string;
  proveedorTelefono?: string;
  proveedorDireccion?: string;
  proveedorNombreVendedor?: string;
  proveedorActivo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/proveedores';
  private sucursalProveedorApiUrl = 'http://localhost:8080/Stockify/api/v1/sucursal-proveedor';

  constructor(private http: HttpClient) {}

  obtenerProveedoresActivos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  obtenerProveedoresActivosPorSucursal(sucursalId: number): Observable<SucursalProveedor[]> {
    return this.http.get<SucursalProveedor[]>(`${this.sucursalProveedorApiUrl}/sucursal/${sucursalId}`);
  }

  crearProveedorConRelacion(proveedor: Proveedor, sucursalId: number): Observable<SucursalProveedor> {
    return this.http.post<SucursalProveedor>(`${this.sucursalProveedorApiUrl}/sucursal/${sucursalId}`, proveedor);
  }

  actualizarProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.sucursalProveedorApiUrl}/proveedor/${proveedor.id}`, proveedor);
  }

  toggleProveedorActivo(proveedorId: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.sucursalProveedorApiUrl}/proveedor/${proveedorId}/activo/${activo}`, null);
  }
}