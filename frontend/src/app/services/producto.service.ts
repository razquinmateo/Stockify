import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  codigoBarra: string;
  imagen: string;
  nombre: string;
  detalle: string;
  precio: number;
  cantidadStock: number;
  sucursalId: number;
  categoriaId: number;
  categoriaNombre?: string;
  activo: boolean;
  proveedorIds?: number[];
  proveedorNombres?: string[];
}

export interface Proveedor {
  id: number;
  rut: string;
  nombre: string;
  direccion: string;
  telefono: string;
  nombreVendedor: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/productos';
  private categoriaUrl = 'http://localhost:8080/Stockify/api/v1/categorias';
  private proveedorUrl = 'http://localhost:8080/Stockify/api/v1/proveedores';

  constructor(private http: HttpClient) {}

  obtenerTodosLosProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/all`);
  }

  obtenerProductosActivosPorSucursal(sucursalId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/sucursal/${sucursalId}/activos`);
  }

  obtenerCategoriaPorId(categoriaId: number): Observable<any> {
    return this.http.get<any>(`${this.categoriaUrl}/${categoriaId}`);
  }

  obtenerProveedoresActivosPorSucursal(sucursalId: number): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.proveedorUrl}/sucursal/${sucursalId}/activos`);
  }

  agregarProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}`, producto);
  }

  actualizarProducto(producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${producto.id}`, producto);
  }
}