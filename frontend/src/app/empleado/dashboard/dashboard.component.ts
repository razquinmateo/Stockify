import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
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
  private wsSub?: Subscription;
  private isModalOpen = false;

  constructor(
    private authService: AuthService,
    private conteoService: ConteoService,
    private wsService: WsService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const sucursalId = this.authService.getSucursalId();

    if (!sucursalId) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      this.router.navigate(['/login']);
      return;
    }

    this.conteoService.getActiveConteos().subscribe({
      next: conteos => {
        const conteoActivo = conteos.find(c =>
          !c.conteoFinalizado && c.activo && c.usuarioId !== undefined
        );

        if (conteoActivo && conteoActivo.tipoConteo) {
          this.navigateToConteo(conteoActivo);
        } else {
          this.waitForConteo(sucursalId);
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo verificar conteos activos', 'error');
        this.waitForConteo(sucursalId);
      }
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    if (this.isModalOpen) {
      Swal.close();
      this.isModalOpen = false;
    }
  }

  private waitForConteo(sucursalId: number): void {
    this.mostrarModalEsperandoConteo();

    this.wsSub = this.wsService.onConteoActivo().subscribe((msg: ConteoMensaje) => {
      console.log('Conteo activo recibido por WebSocket:', msg);

      this.conteoService.getById(msg.id).subscribe({
        next: conteo => {
          if (conteo && conteo.usuarioId !== undefined) {
            this.authService.getAllUsuarios().subscribe({
              next: usuarios => {
                const creador = usuarios.find(u => u.id === conteo.usuarioId);
                if (creador?.sucursalId === sucursalId) {
                  // Guardar en localStorage solo lo que se necesita
                  localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                    id: conteo.id,
                    tipoConteo: conteo.tipoConteo,
                    fechaHora: conteo.fechaHora
                  }));
                  this.navigateToConteo(conteo);
                } else {
                  console.warn(`Conteo ${conteo.id} no pertenece a esta sucursal`);
                }
              },
              error: () => {
                console.error('No se pudieron cargar los usuarios para validar sucursal');
              }
            });
          }
        },
        error: () => {
          console.error(`No se pudo obtener el conteo con ID ${msg.id}`);
        }
      });
    });
  }

  private navigateToConteo(conteo: Conteo): void {
    if (this.isModalOpen) {
      Swal.close();
      this.isModalOpen = false;
    }

    const ruta = conteo.tipoConteo === 'LIBRE'
      ? `/empleado/conteo-libre/${conteo.id}`
      : `/empleado/conteo-categorias/${conteo.id}`;

    console.log(`Redirigiendo a: ${ruta}`);

    this.ngZone.run(() => {
      this.router.navigate([ruta]);
    });
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private mostrarModalEsperandoConteo(): void {
    this.isModalOpen = true;
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
