import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth.service';
import { ConteoService } from '../../services/conteo.service';
import { WsService, ConteoMensaje } from '../../services/webSocket/ws.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class EmpleadoComponent implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'conteoActivoRecibido';
  private wsSubs: Subscription[] = [];
  private isModalOpen = false; // Bandera para rastrear si el modal está abierto

  constructor(
    private authService: AuthService,
    private conteoService: ConteoService,
    private wsService: WsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.conteoService.getActiveConteos().subscribe({
      next: conteos => {
        if (conteos.length > 0) {
          const msg = { id: conteos[0].id, fechaHora: conteos[0].fechaHora.toString() };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(msg));
          this.router.navigate(['/empleado/conteo-libre']);
        } else {
          this.mostrarModalEsperandoConteo();
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo verificar conteos activos', 'error');
        this.mostrarModalEsperandoConteo();
      }
    });

    this.wsSubs.push(
      this.wsService.onConteoActivo().subscribe(msg => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(msg));
        if (this.isModalOpen) {
          Swal.close(); // Cierra el modal si está abierto
          this.isModalOpen = false; // Actualiza la bandera
        }
        this.router.navigate(['/empleado/conteo-libre']);
      })
    );
  }

  ngOnDestroy(): void {
    this.wsSubs.forEach(sub => sub.unsubscribe());
    if (this.isModalOpen) {
      Swal.close(); // Cierra el modal si está abierto al destruir el componente
      this.isModalOpen = false;
    }
  }

  logout(): void {
    localStorage.clear();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private mostrarModalEsperandoConteo() {
    this.isModalOpen = true; // Marca que el modal está abierto
    Swal.fire({
      title: 'Conteo pendiente',
      text: 'Esperando a que inicie el conteo...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });
  }
}