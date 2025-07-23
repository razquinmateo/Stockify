import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { lastValueFrom, Subscription } from 'rxjs';
import { retry, delay } from 'rxjs/operators';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

import { AuthService } from '../../auth.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
import { ConteoProductoService, ConteoProducto } from '../../services/conteo-producto.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { WsService, ConteoMensaje, ConteoProductoMensaje } from '../../services/webSocket/ws.service';

interface RegistroConteo {
  productoId: number;
  codigoProducto: string;
  nombre: string;
  cantidadEsperada: number;
  cantidadContada: number;
  usuario: string;
  usuarioId: number;
  codigosBarra: string[];
}

@Component({
  selector: 'app-conteo-libre',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './conteo-libre.component.html',
  styleUrls: ['./conteo-libre.component.css']
})
export class ConteoLibreComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  nombreUsuarioLogueado = '';
  usuarioId: number | null = null;
  conteoId: number | null = null;
  conteoActual: Conteo | null = null;
  productosConteo: ConteoProducto[] = [];
  allProductos: Producto[] = [];
  registros: RegistroConteo[] = [];
  filtro = '';
  codigoIngresado = '';
  showCameraSelector = false;
  showRegistros = false;

  private codeReader!: BrowserMultiFormatReader;
  private scannerControls?: IScannerControls;
  private currentStream: MediaStream | null = null;

  devices: MediaDeviceInfo[] = [];
  selectedDeviceId: string | null = null;
  mostrarCamara = false;

  private readonly STORAGE_KEY = 'conteoActivoRecibido';
  private readonly REGISTROS_KEY: string;
  private wsSubs: Subscription[] = [];

  private scanBuffer = '';
  private bufferResetTimeout: any;

  constructor(
    private authService: AuthService,
    private conteoService: ConteoService,
    private conteoProdService: ConteoProductoService,
    private productoService: ProductoService,
    private usuarioService: UsuarioService,
    private wsService: WsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    this.conteoId = id ? +id : null;
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.REGISTROS_KEY = `registros_${this.nombreUsuarioLogueado}`;
  }

  ngOnInit(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        const usuario = usuarios.find(u => u.nombreUsuario === this.nombreUsuarioLogueado);
        if (usuario) {
          this.usuarioId = usuario.id;
          this.inicializarConteo();
        } else {
          Swal.fire('Error', 'No se pudo identificar al usuario logueado', 'error');
          this.router.navigate(['/empleado/dashboard']);
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la información del usuario', 'error');
        this.router.navigate(['/empleado/dashboard']);
      }
    });

    window.addEventListener('keydown', this.handleScannerKey);

    // Verificar si la API de cámaras está disponible
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
          console.warn('No se pudo acceder a las cámaras:', err);
          this.devices = []; // Deshabilitar cámara
        });
    } else {
      console.warn('MediaDevices no está disponible en este entorno');
      this.devices = []; // Deshabilitar cámara
    }

    const saved = localStorage.getItem(this.REGISTROS_KEY);
    if (saved) {
      this.registros = JSON.parse(saved);
      this.productosConteo = this.registros.map(r => ({
        id: 0,
        conteoId: this.conteoId || 0,
        productoId: r.productoId,
        cantidadEsperada: r.cantidadEsperada,
        cantidadContada: r.cantidadContada,
        precioActual: 0,
        activo: true
      }));
      this.cdr.detectChanges();
    }

    const sucursalId = this.authService.getSucursalId();
    if (sucursalId == null) {
      Swal.fire('Error', 'No se pudo obtener el ID de la sucursal', 'error');
      this.router.navigate(['/empleado/dashboard']);
      return;
    }
    this.productoService.obtenerProductosActivosPorSucursal(sucursalId).subscribe({
      next: prods => {
        this.allProductos = prods.sort((a, b) => a.codigoProducto.localeCompare(b.codigoProducto));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading productos:', err);
        Swal.fire('Error', 'No se pudo cargar el catálogo de productos activos de la sucursal', 'error');
      }
    });

    this.wsSubs.push(
      this.wsService.onConteoProductoActualizado().subscribe(msg => {
        console.log('WebSocket ConteoProductoMensaje received:', msg);
        if (msg.conteoId === this.conteoId) {
          const prod = this.allProductos.find(p => p.id === msg.productoId);
          if (prod) {
            const existente = this.registros.find(r => r.productoId === msg.productoId);
            const reg: RegistroConteo = {
              productoId: msg.productoId,
              codigoProducto: prod.codigoProducto,
              nombre: prod.nombre,
              cantidadEsperada: msg.cantidadEsperada,
              cantidadContada: msg.cantidadContada ?? 0,
              usuario: this.nombreUsuarioLogueado,
              usuarioId: this.usuarioId!,
              codigosBarra: prod.codigosBarra
            };
            if (existente) {
              Object.assign(existente, reg);
            } else {
              this.registros.push(reg);
            }
            this.registros.sort((a, b) => a.codigoProducto.localeCompare(b.codigoProducto));
            localStorage.setItem(this.REGISTROS_KEY, JSON.stringify(this.registros));

            const item = this.productosConteo.find(p => p.productoId === msg.productoId);
            if (item) {
              item.id = msg.id;
              item.cantidadContada = msg.cantidadContada ?? 0;
              item.precioActual = msg.precioActual;
              item.activo = msg.activo;
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
            console.log('Updated productosConteo:', this.productosConteo);
            console.log('Updated registros:', this.registros);
            this.cdr.detectChanges();
          } else {
            console.warn(`Producto ${msg.productoId} not found in allProductos`);
          }
        } else {
          console.warn(`WebSocket message for conteoId ${msg.conteoId}, expected ${this.conteoId}`);
        }
      })
    );

    this.wsSubs.push(
      this.wsService.onConteoFinalizado().subscribe({
        next: (msg: ConteoMensaje) => {
          if (msg.id === this.conteoId) {
            console.log(`Conteo ${msg.id} finalizado`);
            Swal.fire({
              icon: 'info',
              title: 'Conteo Finalizado',
              text: 'El conteo ha sido finalizado. Serás redirigido al dashboard.',
              timer: 3000,
              showConfirmButton: false
            }).then(() => {
              localStorage.removeItem(this.STORAGE_KEY);
              localStorage.removeItem(this.REGISTROS_KEY);
              this.router.navigate(['/empleado/dashboard']);
            });
          }
        },
        error: (err) => {
          console.error('WebSocket error on conteoFinalizado:', err);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.wsSubs.forEach(sub => sub.unsubscribe());
    this.cerrarCamara();
    window.removeEventListener('keydown', this.handleScannerKey);
  }

  private inicializarConteo(): void {
    const yaRecibido = localStorage.getItem(this.STORAGE_KEY);
    if (this.conteoId) {
      this.cargarConteo(this.conteoId);
    } else if (yaRecibido) {
      const msg = JSON.parse(yaRecibido) as { id: number; fechaHora: string };
      this.cargarConteo(msg.id);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No hay conteo activo',
        text: 'No se encontró un conteo activo para unirse.',
      }).then(() => {
        this.router.navigate(['/empleado/dashboard']);
      });
    }
  }

  private cargarConteo(id: number): void {
    this.conteoService.getById(id).subscribe({
      next: (conteo) => {
        if (conteo.tipoConteo !== 'LIBRE') {
          Swal.fire('Error', 'Este conteo no es de tipo Libre', 'error');
          this.router.navigate(['/empleado/dashboard']);
          return;
        }
        this.conteoActual = conteo;
        this.conteoId = id;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
          id: conteo.id,
          fechaHora: conteo.fechaHora.toString()
        }));
        this.registrarParticipante();
        this.cargarProductosConteo();
      },
      error: (err) => {
        console.error('Error loading conteo:', err);
        Swal.fire('Error', 'No se pudo cargar el conteo', 'error');
        this.router.navigate(['/empleado/dashboard']);
      }
    });
  }

  private cargarProductosConteo(): void {
    if (!this.conteoId) return;
    this.conteoProdService.getConteoProductosByConteoId1(this.conteoId).subscribe({
      next: (productos) => {
        console.log('Loaded conteoProductos:', productos);
        this.productosConteo = productos;
        productos.forEach(p => {
          const prod = this.allProductos.find(prod => prod.id === p.productoId);
          if (prod && !this.registros.find(r => r.productoId === p.productoId)) {
            const reg: RegistroConteo = {
              productoId: p.productoId,
              codigoProducto: prod.codigoProducto,
              nombre: prod.nombre,
              cantidadEsperada: p.cantidadEsperada,
              cantidadContada: p.cantidadContada ?? 0,
              usuario: this.nombreUsuarioLogueado,
              usuarioId: this.usuarioId!,
              codigosBarra: prod.codigosBarra
            };
            this.registros.push(reg);
          }
        });
        this.registros.sort((a, b) => a.codigoProducto.localeCompare(b.codigoProducto));
        localStorage.setItem(this.REGISTROS_KEY, JSON.stringify(this.registros));
        console.log('Initial registros:', this.registros);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading conteoProductos:', err);
        console.warn('Falling back to local storage and WebSocket for conteoProductos');
        Swal.fire({
          icon: 'info',
          title: 'Advertencia',
          text: 'No se pudieron cargar los productos del conteo inicialmente. Los conteos se sincronizarán en tiempo real.',
        });
        this.cdr.detectChanges();
      }
    });
  }

  private registrarParticipante(): void {
    if (this.usuarioId && this.conteoId) {
      this.conteoService.registrarParticipante(this.conteoId, this.usuarioId).subscribe({
        next: () => console.log('Usuario registrado como participante'),
        error: (err) => console.warn('Error registering participante:', err)
      });
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REGISTROS_KEY);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  async abrirCamara(): Promise<void> {
    // Verificar si la API de cámaras está disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !this.devices.length) {
      console.warn('No se puede acceder a la cámara. Usa HTTPS o localhost para habilitarla.');
      this.mostrarCamara = false;
      this.devices = [];
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
      inputPlaceholder: 'Selecciona una cámara…',
      showCancelButton: true
    });

    if (!result.value) return;

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
          video.play().catch(() => {});
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
            .catch(e => {
              console.error('ZXing error:', e);
              this.mostrarCamara = false;
              console.warn('Error al iniciar el escáner de códigos de barras');
            });
        })
        .catch(err => {
          this.mostrarCamara = false;
          console.warn('No se pudo acceder a la cámara:', err);
        });
    }, 0);
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

  async scanCodigo(): Promise<void> {
    const codigo = this.codigoIngresado.trim();
    if (!codigo) {
      Swal.fire('Atención', 'Ingresa o escanea un código válido', 'warning');
      return;
    }
    const prod = this.allProductos.find(p =>
      p.codigosBarra.includes(codigo) ||
      p.codigoProducto.toLowerCase() === codigo.toLowerCase() ||
      p.nombre.toLowerCase().includes(codigo.toLowerCase())
    );
    if (!prod) {
      Swal.fire('Error', `Código "${codigo}" no corresponde a un producto registrado`, 'warning');
      this.codigoIngresado = '';
      return;
    }
    let item = this.productosConteo.find(p => p.productoId === prod.id);
    if (!item) {
      const nuevo: Partial<ConteoProducto> = {
        conteoId: this.conteoActual!.id,
        productoId: prod.id,
        cantidadEsperada: prod.cantidadStock,
        precioActual: prod.precio,
        activo: true
      };
      try {
        const createObservable = this.conteoProdService.create(nuevo).pipe(
          retry(2),
          delay(500)
        );
        item = await lastValueFrom(createObservable);
        this.productosConteo.push(item);
        console.log('Created new ConteoProducto:', item);
      } catch (err) {
        console.error('Error creating conteo producto:', err);
        Swal.fire('Error', 'No se pudo registrar el conteo', 'error');
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
      title: `Ingresar cantidad (esperada: ${item!.cantidadEsperada})`,
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
    this.conteoProdService.update(item!.id, { cantidadContada: nuevaCant }).pipe(
      retry(2),
      delay(500)
    ).subscribe({
      next: updated => {
        item!.cantidadContada = updated.cantidadContada;
        const existente = this.registros.find(r => r.productoId === item!.productoId);
        const reg: RegistroConteo = {
          productoId: item!.productoId,
          codigoProducto: prod.codigoProducto,
          nombre: prod.nombre,
          cantidadEsperada: item!.cantidadEsperada,
          cantidadContada: updated.cantidadContada ?? 0,
          usuario: this.nombreUsuarioLogueado,
          usuarioId: this.usuarioId!,
          codigosBarra: prod.codigosBarra
        };
        if (existente) {
          Object.assign(existente, reg);
        } else {
          this.registros.push(reg);
        }
        this.registros.sort((a, b) => a.codigoProducto.localeCompare(b.codigoProducto));
        localStorage.setItem(this.REGISTROS_KEY, JSON.stringify(this.registros));
        console.log('Registros after scan:', this.registros);

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('registros_') && key !== this.REGISTROS_KEY) {
            const arr: RegistroConteo[] = JSON.parse(localStorage.getItem(key) || '[]');
            const sinEste = arr.filter(r => r.productoId !== item!.productoId);
            localStorage.setItem(key, JSON.stringify(sinEste));
          }
        }
        this.codigoIngresado = '';
        this.cdr.detectChanges();
        this.registrarParticipante();
      },
      error: (err) => {
        console.error('Error updating conteo:', err);
        Swal.fire('Error', 'No se pudo actualizar la cantidad', 'error');
      }
    });
  }

  get registrosFiltrados(): RegistroConteo[] {
    const term = this.filtro.trim().toLowerCase();
    return term
      ? this.registros.filter(r =>
        r.codigoProducto.toLowerCase().includes(term) ||
        r.nombre.toLowerCase().includes(term) ||
        r.codigosBarra.some(c => c.toLowerCase().includes(term))
      )
      : this.registros;
  }

  get productosNoContados(): Producto[] {
    const contadosIds = this.productosConteo.map(p => p.productoId);
    return this.allProductos.filter(p => !contadosIds.includes(p.id));
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

  volverDashboard(): void {
    this.router.navigate(['/empleado/dashboard']);
  }
}