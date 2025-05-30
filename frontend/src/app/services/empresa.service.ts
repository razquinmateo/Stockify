import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Podés reemplazar esto con una interfaz más específica si ya la tenés
export interface Empresa {
  id: number;
  nombre: string;
  rut: string;
  direccion: string;
  telefono: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = `${environment.apiUrl}/conteos`;

  constructor(private http: HttpClient) {}

  // Obtener todas las empresas (activas e inactivas)
  getAllEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.apiUrl}/all`);
  }

  // Deshabilitar empresa por ID
  deshabilitarEmpresa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Crear nueva empresa
  crearEmpresa(empresa: Partial<Empresa>): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}`, empresa);
  }

  // Obtener empresa por ID
  getEmpresaById(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`);
  }

  // Actualizar empresa existente
  actualizarEmpresa(id: number, empresa: Partial<Empresa>): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/${id}`, empresa);
  }
}
