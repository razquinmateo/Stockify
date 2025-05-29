import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioDto } from '../models/usuario-dto';

export interface Conteo {
  id: number;
  fechaHora: string;
  conteoFinalizado: boolean;
  usuarioId: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConteoService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/conteos';

  constructor(private http: HttpClient) {}

    obtenerTodosLosConteos(): Observable<Conteo[]> {
      return this.http.get<Conteo[]>(`${this.apiUrl}/all`);
    }

    agregarConteo(conteo: Conteo): Observable<Conteo> {
      return this.http.post<Conteo>(`${this.apiUrl}`, conteo);
    }

    actualizarConteo(conteo: Conteo): Observable<Conteo> {
      return this.http.put<Conteo>(`${this.apiUrl}/${conteo.id}`, conteo);
    }

    obtenerUsuariosPorConteo(conteoId: number): Observable<UsuarioDto[]> {
      return this.http.get<UsuarioDto[]>(`http://localhost:8080/Stockify/api/v1/conteo-usuarios/por-conteo/${conteoId}`);
    }

    crearConteo(conteo: Partial<Conteo>): Observable<Conteo> {
      return this.http.post<Conteo>(`${this.apiUrl}`, conteo);
    }


}