import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { lastValueFrom, Subscription } from 'rxjs';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

import { AuthService } from '../../auth.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
import { ConteoProductoService, ConteoProducto } from '../../services/conteo-producto.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { WsService, ConteoMensaje, ConteoProductoMensaje } from '../../services/webSocket/ws.service';

interface RegistroConteo {
  productoId: number;
  nombre: string;
  cantidadEsperada: number;
  cantidadContada: number;
  usuario: string;
  usuarioId: number;
  codigoBarra?: string
}

@Component({
  selector: 'app-admin-conteo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unirse-conteo.component.html',
  styleUrls: ['./unirse-conteo.component.css']
})
export class UnirseConteoComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  nombreUsuarioLogueado = '';
  usuarioId!: number;
  conteoActual!: Conteo;
  productosConteo: ConteoProducto[] = [];
  allProductos: Producto[] = [];
  registros: RegistroConteo[] = [];
  filtro = '';
  codigoIngresado = '';
  showCameraSelector = false;
  showRegistros = true;
  activeTab = 'no-contados';

  private codeReader!: BrowserMultiFormatReader;
  private scannerControls?: IScannerControls;
  private currentStream: MediaStream | null = null;

  devices: MediaDeviceInfo[] = [];
  selectedDeviceId: string | null = null;
  mostrarCamara = false;

  private readonly STORAGE_KEY = 'conteoActivoRecibido';
  private wsSubs: Subscription[] = [];

  private scanBuffer = '';
  private bufferResetTimeout!: any;

  constructor(
    private authService: AuthService,
    private conteoService: ConteoService,
    private conteoProdService: ConteoProductoService,
    private productoService: ProductoService,
    private wsService: WsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.authService.getUsuarioIdDesdeToken().subscribe({
      next: id => this.usuarioId = id,
      error: () => Swal.fire('Error', 'No se pudo determinar tu ID de usuario', 'error')
    });

    window.addEventListener('keydown', this.handleScannerKey);

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devs: MediaDeviceInfo[]) => {
        this.devices = devs.filter(d => d.kind === 'videoinput');
        if (this.devices.length) {
          this.selectedDeviceId = this.devices[0].deviceId;
        }
      })
      .catch(err => {
        console.warn('No se pudo acceder a las cámaras', err);
        Swal.fire('Error', 'No se pudo acceder a las cámaras', 'error');
      });

    const saved = localStorage.getItem('registros_' + this.nombreUsuarioLogueado);
    if (saved) {
      this.registros = JSON.parse(saved);
    }

    this.productoService.obtenerTodosLosProductos().subscribe({
      next: prods => this.allProductos = prods,
      error: () => Swal.fire('Error', 'No se pudo cargar catálogo de productos', 'error')
    });

    // Obtener ID del conteo desde la ruta
    const conteoId = +this.route.snapshot.paramMap.get('id')!;
    if (conteoId) {
      this.conteoService.getById(conteoId).subscribe({
        next: conteo => {
          const msg = { id: conteo.id, fechaHora: conteo.fechaHora.toString() };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(msg));
          this.arrancarConteo(conteo); // Cambiado: Pasa el conteo completo
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cargar el conteo', 'error');
          this.router.navigate(['/admin/gestionar-conteos']);
        }
      });
    } else {
      this.router.navigate(['/admin/gestionar-conteos']);
    }

    this.wsSubs.push(
      this.wsService.onConteoFinalizado().subscribe(_ => {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(`registros_${this.nombreUsuarioLogueado}`);
        this.registros = [];
        this.conteoActual = undefined!;
        this.router.navigate(['/admin/gestionar-conteos']);
      })
    );

    this.wsSubs.push(
      this.wsService.onConteoProductoActualizado().subscribe(msg => {
        if (msg.conteoId === this.conteoActual?.id) {
          const prod = this.allProductos.find(p => p.id === msg.productoId);
          if (prod) {
            const existente = this.registros.find(r => r.productoId === msg.productoId);
            const reg: RegistroConteo = {
              productoId: msg.productoId,
              nombre: prod.nombre,
              cantidadEsperada: msg.cantidadEsperada,
              cantidadContada: msg.cantidadContada ?? 0,
              usuario: this.nombreUsuarioLogueado,
              usuarioId: this.usuarioId,
              codigoBarra: prod.codigoBarra
            };
            if (existente) {
              Object.assign(existente, reg);
            } else {
              this.registros.push(reg);
            }
            localStorage.setItem(`registros_${this.nombreUsuarioLogueado}`, JSON.stringify(this.registros));
            const item = this.productosConteo.find(p => p.productoId === msg.productoId);
            if (item) {
              item.cantidadContada = msg.cantidadContada ?? 0;
            } else {
              this.productosConteo.push({
                id: msg.id,
                conteoId: msg.conteoId,
                productoId: msg.productoId,
                cantidadEsperada: msg.cantidadEsperada,
                cantidadContada: msg.cantidadContada ?? 0,
                precioActual: msg.precioActual,
                activo: msg.activo
              });
            }
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
    this.wsSubs.forEach(sub => sub.unsubscribe());
    this.cerrarCamara();
    window.removeEventListener('keydown', this.handleScannerKey);
  }

  private arrancarConteo(conteo: Conteo): void { // Cambiado: Recibe Conteo completo
    Swal.close();
    this.conteoActual = {
      id: conteo.id,
      fechaHora: conteo.fechaHora,
      conteoFinalizado: conteo.conteoFinalizado,
      usuarioId: conteo.usuarioId, // Usa el usuarioId real del conteo
      activo: conteo.activo
    };
    this.conteoProdService.getActiveConteoProductos().subscribe({
      next: items => {
        this.productosConteo = items.filter(p => p.conteoId === this.conteoActual.id);
        this.registros = items.filter(p => p.conteoId === this.conteoActual.id).map(item => {
          const prod = this.allProductos.find(p => p.id === item.productoId);
          return {
            productoId: item.productoId,
            nombre: prod ? prod.nombre : 'Desconocido',
            cantidadEsperada: item.cantidadEsperada,
            cantidadContada: item.cantidadContada ?? 0,
            usuario: this.nombreUsuarioLogueado,
            usuarioId: this.usuarioId,
            codigoBarra: prod?.codigoBarra
          };
        });
        localStorage.setItem(`registros_${this.nombreUsuarioLogueado}`, JSON.stringify(this.registros));
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los productos del conteo', 'error')
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  cerrarCamara(): void {
    this.mostrarCamara = false;
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
    }
    if (this.scannerControls) {
      this.scannerControls.stop();
      this.scannerControls = undefined;
    }
  }

  async abrirCamara(): Promise<void> {
    if (!this.devices.length) {
      Swal.fire('Error', 'No se detectaron cámaras', 'warning');
      return;
    }

    const inputOptions: Record<string, string> = {};
    this.devices.forEach((d, i) => {
      inputOptions[d.deviceId] = d.label || `Cámara ${i + 1}`;
    });

    const result = await Swal.fire<string>({
      position: 'center',
      heightAuto: false,
      title: 'Selecciona la cámara',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Elige una cámara…',
      showCancelButton: true
    });

    if (!result.value) {
      return;
    }

    this.selectedDeviceId = result.value;
    this.mostrarCamara = true;

    setTimeout(() => {
      const video = this.videoRef.nativeElement;
      navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: this.selectedDeviceId! } }
      })
        .then(stream => {
          this.currentStream = stream;
          video.srcObject = stream;
          video.play().catch(() => { });

          this.codeReader = new BrowserMultiFormatReader();
          this.codeReader.decodeFromVideoDevice(
            this.selectedDeviceId!,
            video,
            (res, err) => {
              if (res) {
                this.codigoIngresado = res.getText();
                this.scanCodigo();
              }
            }
          )
            .then(ctrl => this.scannerControls = ctrl)
            .catch(e => console.error('ZXing error:', e));
        })
        .catch(err => {
          this.mostrarCamara = false;
          Swal.fire('Error', 'No se pudo acceder a la cámara: ' + err.message, 'error');
        });
    }, 0);
  }

  async scanCodigo(): Promise<void> {
    const codigo = this.codigoIngresado.trim();
    if (!codigo) {
      await Swal.fire('Atención', 'Ingresa o escanea un código válido', 'warning');
      return;
    }
    const prod = this.allProductos.find(p =>
      p.codigoBarra === codigo || p.id.toString() === codigo
    );
    if (!prod) {
      await Swal.fire({
        title: 'No existe',
        text: `Código leído: "${codigo}". Producto no registrado.`,
        icon: 'warning'
      });
      this.codigoIngresado = '';
      return;
    }
    let item = this.productosConteo.find(p => p.productoId === prod.id);
    if (!item) {
      const nuevo: Partial<ConteoProducto> = {
        conteoId: this.conteoActual.id,
        productoId: prod.id,
        cantidadEsperada: prod.cantidadStock,
        precioActual: prod.precio,
        activo: true
      };
      try {
        item = await lastValueFrom(this.conteoProdService.create(nuevo));
        this.productosConteo.push(item!);
      } catch {
        await Swal.fire('Error', 'No se pudo crear registro de conteo', 'error');
        this.codigoIngresado = '';
        return;
      }
    }
    if (item.cantidadContada != null) {
      const { isConfirmed } = await Swal.fire({
        title: 'Producto ya contado',
        text: `Cantidad actual: ${item.cantidadContada}. ¿Editar?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      });
      if (!isConfirmed) {
        this.codigoIngresado = '';
        return;
      }
    }
    const { value, isConfirmed } = await Swal.fire<number>({
      title: `Ingresar cantidad (esperado: ${item!.cantidadEsperada})`,
      input: 'number',
      inputLabel: prod.nombre,
      inputValue: item!.cantidadContada ?? '',
      showCancelButton: true
    });
    if (!isConfirmed || value == null) {
      this.codigoIngresado = '';
      return;
    }
    const nuevaCant = Number(value);
    this.conteoProdService.update(item!.id, { cantidadContada: nuevaCant })
      .subscribe({
        next: updated => {
          item!.cantidadContada = updated.cantidadContada;
          const existente = this.registros.find(r => r.productoId === item!.productoId);
          const reg: RegistroConteo = {
            productoId: item!.productoId,
            nombre: prod.nombre,
            cantidadEsperada: item!.cantidadEsperada,
            cantidadContada: updated.cantidadContada,
            usuario: this.nombreUsuarioLogueado,
            usuarioId: this.usuarioId,
            codigoBarra: prod.codigoBarra
          };
          existente ? Object.assign(existente, reg) : this.registros.push(reg);
          localStorage.setItem(`registros_${this.nombreUsuarioLogueado}`, JSON.stringify(this.registros));

          const claveActual = `registros_${this.nombreUsuarioLogueado}`;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('registros_') && key !== claveActual) {
              const arr: RegistroConteo[] = JSON.parse(localStorage.getItem(key) || '[]');
              const sinEste = arr.filter(r => r.productoId !== item!.productoId);
              localStorage.setItem(key, JSON.stringify(sinEste));
            }
          }
          this.codigoIngresado = '';
          this.conteoService
            .registrarParticipante(this.conteoActual.id, this.usuarioId)
            .subscribe({
              next: dto => console.log('Registrado:', dto),
              error: err => console.error('Error registro pivote:', err)
            });
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar la cantidad', 'error')
      });
  }

  get registrosFiltrados(): RegistroConteo[] {
    const term = this.filtro.trim().toLowerCase();
    return term
      ? this.registros.filter(r =>
        r.productoId.toString().includes(term) ||
        r.nombre.toLowerCase().includes(term)
      )
      : this.registros;
  }

  get productosNoContados(): Producto[] {
    const contadosIds = this.productosConteo.map(p => p.productoId);
    return this.allProductos.filter(p => !contadosIds.includes(p.id));
  }

  get estadisticas() {
    const totalProductos = this.allProductos.length;
    const contados = this.productosConteo.length;
    const noContados = totalProductos - contados;
    const porcentajeContados = totalProductos > 0 ? (contados / totalProductos * 100).toFixed(2) : '0.00';
    return {
      totalProductos,
      contados,
      noContados,
      porcentajeContados
    };
  }

  private handleScannerKey = (evt: KeyboardEvent) => {
    if (evt.key === 'Enter') {
      const code = this.scanBuffer.trim();
      this.scanBuffer = '';
      clearTimeout(this.bufferResetTimeout);

      if (code) {
        this.codigoIngresado = code;
        this.scanCodigo();
      }
    } else if (evt.key.length === 1) {
      this.scanBuffer += evt.key;
      clearTimeout(this.bufferResetTimeout);
      this.bufferResetTimeout = setTimeout(() => this.scanBuffer = '', 100);
    }
  };

  finalizarConteo(): void { // Cambiado: Mejora manejo de errores y console.log
    const productosNoContados = this.productosNoContados;
    if (productosNoContados.length === 0) {
      Swal.fire({
        title: '¿Finalizar conteo?',
        text: 'El conteo será finalizado. Todos los productos han sido contados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          console.log('Contenido de this.conteoActual:', this.conteoActual);
          this.conteoActual.conteoFinalizado = true;
          this.conteoService.actualizarConteo(this.conteoActual).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Conteo finalizado',
                text: 'El conteo ha sido marcado como finalizado correctamente.',
                timer: 2000,
                showConfirmButton: false
              });
              this.router.navigate(['/admin/gestionar-conteos']);
            },
            error: (err) => {
              if (err.status === 403) {
                Swal.fire({
                  icon: 'error',
                  title: 'Permiso denegado',
                  text: 'No tienes permisos para finalizar este conteo. Contacta al administrador.'
                });
              } else {
                Swal.fire('Error', 'No se pudo finalizar el conteo', 'error');
              }
            }
          });
        }
      });
    } else {
      const tablaProductos = productosNoContados
        .map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.codigoBarra || 'N/A'}</td>
          </tr>
        `)
        .join('');
      Swal.fire({
        title: '¿Finalizar conteo con productos sin contar?',
        html: `
          <p>Hay <strong>${productosNoContados.length}</strong> producto(s) sin contar:</p>
          <div class="non-counted-products">
            <table class="table table-striped table-bordered">
              <thead class="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Código de Barras</th>
                </tr>
              </thead>
              <tbody>
                ${tablaProductos}
              </tbody>
            </table>
          </div>
          <p>¿Estás seguro de finalizar el conteo?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          console.log('Contenido de this.conteoActual:', this.conteoActual);
          this.conteoActual.conteoFinalizado = true;
          this.conteoService.actualizarConteo(this.conteoActual).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Conteo finalizado',
                text: 'El conteo ha sido marcado como finalizado correctamente, aunque algunos productos no fueron contados.',
                timer: 2000,
                showConfirmButton: false
              });
              this.router.navigate(['/admin/gestionar-conteos']);
            },
            error: (err) => {
              if (err.status === 403) {
                Swal.fire({
                  icon: 'error',
                  title: 'Permiso denegado',
                  text: 'No tienes permisos para finalizar este conteo. Contacta al administrador.'
                });
              } else {
                Swal.fire('Error', 'No se pudo finalizar el conteo', 'error');
              }
            }
          });
        }
      });
    }
  }

  volverGestionarConteos(): void {
    this.router.navigate(['/admin/gestionar-conteos']);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}