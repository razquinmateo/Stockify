import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/Stockify/api/v1/seguridad/login';

  constructor(private http: HttpClient) {}

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
}