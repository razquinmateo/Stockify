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
  productoIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/proveedores';

  constructor(private http: HttpClient) {}

  obtenerProveedoresActivos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  obtenerProveedoresActivosPorSucursal(sucursalId: number): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/sucursal/${sucursalId}/activos`);
  }

  crearProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
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