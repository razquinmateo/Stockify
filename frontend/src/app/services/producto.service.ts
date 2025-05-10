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
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/productos';
  private categoriaUrl = 'http://localhost:8080/Stockify/api/v1/categorias';

  constructor(private http: HttpClient) {}

  obtenerTodosLosProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/all`);
  }

  obtenerCategoriaPorId(categoriaId: number): Observable<any> {
    return this.http.get<any>(`${this.categoriaUrl}/${categoriaId}`);
  }

  agregarProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}`, producto);
  }

  actualizarProducto(producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${producto.id}`, producto);
  }
}