import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Producto {
  id: number;
  codigosBarra: string[];
  imagen: string | null;
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
  private apiUrl = `${environment.apiUrl}/productos`;
  private categoriaUrl = `${environment.apiUrl}/categorias`;
  private proveedorUrl = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) { }

  obtenerTodosLosProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/all`).pipe(
      map(productos => productos.map(prod => ({
        ...prod,
        imagen: this.sanitizeImagen(prod.imagen)
      })))
    );
  }

  obtenerProductosActivosPorSucursal(sucursalId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/sucursal/${sucursalId}/activos`).pipe(
      map(productos => productos.map(prod => ({
        ...prod,
        imagen: this.sanitizeImagen(prod.imagen)
      })))
    );
  }

  obtenerProductoPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`).pipe(
      map(prod => ({
        ...prod,
        imagen: this.sanitizeImagen(prod.imagen)
      }))
    );
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

  actualizarMasivoProductos(productos: { codigosBarra: string[]; precio: number; cantidadStock: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/actualizar-masivo`, productos);
  }

  private sanitizeImagen(imagen: string | null): string | null {
    if (!imagen || !imagen.startsWith('data:image/') || !imagen.includes('base64,')) {
      return null;
    }
    try {
      const base64Data = imagen.split(',')[1];
      if (!base64Data) return null;
      atob(base64Data);
      return imagen;
    } catch (e) {
      console.warn(`Invalid base64 image: ${imagen}`);
      return null;
    }
  }
}