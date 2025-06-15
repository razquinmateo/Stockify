import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { lastValueFrom, Subscription } from 'rxjs';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

import { AuthService } from '../../auth.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
import { ConteoProductoService, ConteoProducto } from '../../services/conteo-producto.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';
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
  templateUrl: './unirse-conteo-libre.component.html',
  styleUrls: ['./unirse-conteo-libre.component.css']
})
export class UnirseConteoLibreComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  nombreUsuarioLogueado = '';
  usuarioId!: number;
  conteoActual!: Conteo;
  productosConteo: ConteoProducto[] = [];
  allProductos: Producto[] = [];
  usuarios: Usuario[] = [];
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
    private usuarioService: UsuarioService,
    private wsService: WsService,
    private router: Router,
    private cdr: ChangeDetectorRef // Inyectar ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.authService.getUsuarioIdDesdeToken().subscribe({
      next: id => {
        this.usuarioId = id;
        console.log('Usuario ID cargado:', this.usuarioId);
      },
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
        console.log('Cámaras detectadas:', this.devices);
      })
      .catch(err => {
        console.warn('No se pudo acceder a las cámaras', err);
        Swal.fire('Error', 'No se pudo acceder a las cámaras', 'error');
      });

    const saved = localStorage.getItem('registros_' + this.nombreUsuarioLogueado);
    if (saved) {
      this.registros = JSON.parse(saved);
      console.log('Registros cargados desde localStorage:', this.registros);
    }

    const sucursalId = this.authService.getSucursalId();
    if (sucursalId == null) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      this.router.navigate(['/admin/gestionar-conteos']);
      return;
    }
    console.log('Sucursal ID:', sucursalId);

    this.productoService.obtenerProductosActivosPorSucursal(sucursalId).subscribe({
      next: prods => {
        this.allProductos = prods.sort((a, b) => a.id - b.id);
        console.log('Productos cargados:', this.allProductos);
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el catálogo de productos activos de la sucursal', 'error')
    });

    // Cargar usuarios antes de buscar conteos activos
    this.usuarioService.getUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        console.log('Usuarios cargados:', this.usuarios);

        // Obtener conteo activo desde el servicio
        this.conteoService.getActiveConteos().subscribe({
          next: conteos => {
            console.log('Conteos activos:', conteos);
            const conteoActivo = conteos.find(c => {
              const usuario = this.usuarios.find(u => u.id === c.usuarioId);
              console.log(`Evaluando conteo ID ${c.id}:`, { usuario, sucursalId, finalizado: c.conteoFinalizado });
              return usuario?.sucursalId === sucursalId && !c.conteoFinalizado;
            });
            if (conteoActivo) {
              console.log('Conteo activo encontrado:', conteoActivo);
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                id: conteoActivo.id,
                fechaHora: conteoActivo.fechaHora.toString()
              }));
              this.arrancarConteo(conteoActivo);
            } else {
              console.log('No se encontró conteo activo');
              Swal.fire({
                icon: 'warning',
                title: 'No hay conteo activo',
                text: 'No se encontró un conteo activo en tu sucursal.',
              }).then(() => {
                this.router.navigate(['/admin/gestionar-conteos']);
              });
            }
          },
          error: () => {
            Swal.fire('Error', 'No se pudo verificar conteos activos', 'error');
            this.router.navigate(['/admin/gestionar-conteos']);
          }
        });
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        this.router.navigate(['/admin/gestionar-conteos']);
      }
    });

    // Subscripción al topic conteo-producto-actualizado
    this.wsSubs.push(
      this.wsService.onConteoProductoActualizado().subscribe(msg => {
        console.log('Mensaje recibido en /topic/conteo-producto-actualizado:', msg);
        if (msg.conteoId === this.conteoActual?.id) {
          console.log('Procesando mensaje para conteo actual ID:', this.conteoActual.id);
          const prod = this.allProductos.find(p => p.id === msg.productoId);
          if (prod) {
            console.log('Producto encontrado:', prod);
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
              console.log('Actualizando registro existente:', reg);
              Object.assign(existente, reg);
            } else {
              console.log('Agregando nuevo registro:', reg);
              this.registros.push(reg);
            }
            localStorage.setItem(`registros_${this.nombreUsuarioLogueado}`, JSON.stringify(this.registros));
            console.log('Registros actualizados:', this.registros);

            const item = this.productosConteo.find(p => p.productoId === msg.productoId);
            if (item) {
              console.log('Actualizando producto contado existente:', item);
              item.cantidadContada = msg.cantidadContada ?? 0;
            } else {
              console.log('Agregando nuevo producto contado:', msg);
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
            console.log('Productos contados actualizados:', this.productosConteo);

            // Forzar detección de cambios para actualizar tablas
            this.cdr.detectChanges();
            console.log('Detección de cambios ejecutada para actualizar UI');

            // Notificación opcional (descomentar si se desea)
            /*
            Swal.fire({
              icon: 'info',
              title: 'Producto actualizado',
              text: `El producto ${prod.nombre} (ID: ${msg.productoId}) ha sido actualizado. Cantidad contada: ${msg.cantidadContada ?? 0}`,
              timer: 2000,
              showConfirmButton: false
            });
            */
          } else {
            console.warn('Producto no encontrado para ID:', msg.productoId);
          }
        } else {
          console.log('Mensaje ignorado, no pertenece al conteo actual');
        }
      })
    );

    // Subscripción al topic conteo-finalizado
    this.wsSubs.push(
      this.wsService.onConteoFinalizado().subscribe(msg => {
        console.log('Mensaje recibido en /topic/conteo-finalizado:', msg);
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(`registros_${this.nombreUsuarioLogueado}`);
        this.registros = [];
        this.conteoActual = undefined!;
        this.router.navigate(['/admin/gestionar-conteos']);
      })
    );
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
    this.wsSubs.forEach(sub => sub.unsubscribe());
    this.cerrarCamara();
    window.removeEventListener('keydown', this.handleScannerKey);
  }

  private arrancarConteo(conteo: Conteo): void {
    Swal.close();
    this.conteoActual = {
      id: conteo.id,
      fechaHora: conteo.fechaHora,
      conteoFinalizado: conteo.conteoFinalizado,
      usuarioId: conteo.usuarioId,
      activo: conteo.activo
    };
    console.log('Conteo actual iniciado:', this.conteoActual);
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
        console.log('Productos contados cargados:', this.productosConteo);
        console.log('Registros iniciales:', this.registros);
        this.cdr.detectChanges(); // Forzar actualización de la UI al iniciar el conteo
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
        this.cdr.detectChanges(); // Actualizar UI al crear nuevo item
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
          this.cdr.detectChanges(); // Actualizar UI después de actualizar conteo
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

  finalizarConteo(): void {
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
    this.cdr.detectChanges(); // Actualizar UI al cambiar pestaña
  }
}