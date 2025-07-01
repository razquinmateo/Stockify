import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

interface LoginRequest {
  nombreUsuario: string;
  contrasenia: string;
}

interface LoginResponse {
  token: string;
  error?: string;
}

interface JwtPayload {
  rol: string;
  sub: string;
  sucursalId: number | null;
  iat: number;
  exp: number;
}

export interface UsuarioDto {
  id: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  rol: string;
  sucursalId: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL para login
  private apiUrl = `${environment.apiUrl}/seguridad/login`;
  // Base para otros endpoints
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credentials).pipe(
      tap(response => {
        if (response.error) {
          throw new Error(response.error);
        }
        localStorage.setItem('token', response.token);
      })
    );
  }

  getUserRole(): string {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.rol;
      } catch (error) {
        console.error('Error decoding token:', error);
        return '';
      }
    }
    return '';
  }

  getSucursalId(): number | null {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.sucursalId;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUsuarioDesdeToken(): string {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.sub; // el nombre de usuario logueado
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        return '';
      }
    }
    return '';
  }

  /** Recupera TODOS los usuarios */
  getAllUsuarios(): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(
      `${this.baseUrl}/usuarios/all`
    );
  }

  /**  Devuelve el ID de usuario buscando en /usuarios/all */
  getUsuarioIdDesdeToken(): Observable<number> {
    const nombre = this.getUsuarioDesdeToken();
    const sucursal = this.getSucursalId();
    return this.getAllUsuarios().pipe(
      map(usuarios => {
        const perfil = usuarios.find(u =>
          u.nombreUsuario === nombre && u.sucursalId === sucursal
        );
        if (!perfil) {
          throw new Error('Usuario no encontrado en el listado');
        }
        return perfil.id;
      })
    );
  }

  /** Devuelve el nombre completo del usuario autenticado */
  getNombreCompletoDesdeToken(): Observable<string> {
    const nombreUsuario = this.getUsuarioDesdeToken();
    const sucursalId = this.getSucursalId();

    return this.getAllUsuarios().pipe(
      map(usuarios => {
        const perfil = usuarios.find(u =>
          u.nombreUsuario === nombreUsuario && u.sucursalId === sucursalId
        );
        if (!perfil) {
          throw new Error('Usuario no encontrado en el listado');
        }
        return `${perfil.nombre} ${perfil.apellido}`;
      })
    );
  }

}