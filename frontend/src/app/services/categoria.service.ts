import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  codigoCategoria: string;
  sucursalId: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  obtenerTodasLasCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/all`);
  }

  obtenerCategoriasPorSucursal(sucursalId: number): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/sucursal/${sucursalId}`);
  }

  obtenerCategoriaPorCodigo(codigoCategoria: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/codigo/${codigoCategoria}`);
  }

  obtenerCategoriaPorCodigoYSucursal(codigoCategoria: string, sucursalId: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/codigo/${codigoCategoria}/sucursal/${sucursalId}`);
  }

  agregarCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}`, categoria);
  }

  actualizarCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${categoria.id}`, categoria);
  }
}