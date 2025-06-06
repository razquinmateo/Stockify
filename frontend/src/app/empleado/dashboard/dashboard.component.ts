import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef
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
import { WsService, ConteoMensaje, ConteoProductoMensaje } from '../../services/webSocket/ws.service';

// Registro de conteo por usuario
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
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class EmpleadoComponent implements OnInit, OnDestroy {
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
  showRegistros = false;


  private codeReader!: BrowserMultiFormatReader;
  private scannerControls?: IScannerControls;
  private currentStream: MediaStream | null = null;

  devices: MediaDeviceInfo[] = [];
  selectedDeviceId: string | null = null;
  mostrarCamara = false;

  // clave para recordar en localStorage que ya llegó el conteo
  private readonly STORAGE_KEY = 'conteoActivoRecibido';
  private wsSubs: Subscription[] = []; // Cambiado a array para múltiples suscripciones

  private scanBuffer = '';
  private bufferResetTimeout!: any;

  constructor(
    private authService: AuthService,
    private conteoService: ConteoService,
    private conteoProdService: ConteoProductoService,
    private productoService: ProductoService,
    private wsService: WsService,
    private router: Router
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

    // Verificar si hay un conteo activo en el servidor // Nuevo: Verifica conteos activos al iniciar
    this.conteoService.getActiveConteos().subscribe({
      next: conteos => {
        if (conteos.length > 0) {
          const msg = { id: conteos[0].id, fechaHora: conteos[0].fechaHora.toString() };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(msg));
          this.arrancarConteo(msg);
        } else {
          const yaRecibido = localStorage.getItem(this.STORAGE_KEY);
          if (yaRecibido) {
            const msg = JSON.parse(yaRecibido) as { id: number; fechaHora: string };
            this.arrancarConteo(msg);
          } else {
            this.mostrarModalEsperandoConteo();
          }
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo verificar conteos activos', 'error');
        const yaRecibido = localStorage.getItem(this.STORAGE_KEY);
        if (yaRecibido) {
          const msg = JSON.parse(yaRecibido) as { id: number; fechaHora: string };
          this.arrancarConteo(msg);
        } else {
          this.mostrarModalEsperandoConteo();
        }
      }
    });

    // Suscribirse a conteo activo
    this.wsSubs.push(
      this.wsService.onConteoActivo().subscribe(msg => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(msg));
        this.arrancarConteo(msg);
      })
    );

    // Suscribirse a conteo finalizado
    this.wsSubs.push(
      this.wsService.onConteoFinalizado().subscribe(_ => {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(`registros_${this.nombreUsuarioLogueado}`);
        this.registros = [];
        this.conteoActual = undefined!;
        this.mostrarModalEsperandoConteo();
      })
    );

    // Suscribirse a actualizaciones de conteo producto
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
              cantidadContada: msg.cantidadContada ?? 0, // Manejo de null
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
              item.cantidadContada = msg.cantidadContada ?? 0; // Manejo de null
            } else {
              this.productosConteo.push({
                id: msg.id,
                conteoId: msg.conteoId,
                productoId: msg.productoId,
                cantidadEsperada: msg.cantidadEsperada,
                cantidadContada: msg.cantidadContada ?? 0, // Manejo de null
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
    this.wsSubs.forEach(sub => sub.unsubscribe()); // Desuscribir todas
    this.cerrarCamara();
    window.removeEventListener('keydown', this.handleScannerKey);
  }

  private arrancarConteo(msg: { id: number; fechaHora: string }) {
    Swal.close();
    this.conteoActual = {
      id: msg.id,
      fechaHora: msg.fechaHora,
      conteoFinalizado: false,
      usuarioId: 0,
      activo: true
    };
    //cargamos los productos del conteo y poblamos los registros
    this.conteoProdService.getActiveConteoProductos().subscribe({
      next: items => {
        this.productosConteo = items.filter(p => p.conteoId === this.conteoActual.id);
        this.registros = this.productosConteo.map(item => {
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
    localStorage.clear();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /** Muestra modal hasta que haya conteo activo */
  private mostrarModalEsperandoConteo() {
    Swal.fire({
      title: 'Conteo pendiente',
      text: 'Esperando a que inicie el conteo...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });
  }

  /** Carga productos del conteo activo */
  private cargarProductosConteo() {
    this.conteoProdService.getActiveConteoProductos().subscribe({
      next: items => {
        this.productosConteo = items.filter(p => p.conteoId === this.conteoActual.id);
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los productos del conteo', 'error')
    });
  }

  /** Abre la cámara y arranca ZXing */
  async abrirCamara(): Promise<void> {
    if (!this.devices.length) {
      Swal.fire('Error', 'No se detectaron cámaras', 'warning');
      return;
    }

    const inputOptions: Record<string, string> = {};
    this.devices.forEach((d, i) => {
      inputOptions[d.deviceId] = d.label || `Cámara ${i + 1}`;
    });

    // Muestro el modal y cojo el resultado completo, no solo el value
    const result = await Swal.fire<string>({
      position: 'center',
      heightAuto: false,
      title: 'Selecciona la cámara',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Elige una cámara…',
      showCancelButton: true
    });

    // Si canceló o no seleccionó, salimos
    if (!result.value) {
      return;
    }

    // Ahora sí, asignamos el string a la propiedad que declaraste como string|null
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

  /** Cierra la cámara y detiene el escáner */
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

  /** Escaneo o búsqueda manual */
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

          // limpiar este producto de otros usuarios
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
          // registra en la tabla pivote
          //const fechaHora = new Date().toISOString();
          // 1) Llamo al servicio para que guarde en la DB pivote (conteo y usuario)
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

  /** Filtrado de registros para la tabla */
  get registrosFiltrados(): RegistroConteo[] {
    const term = this.filtro.trim().toLowerCase();
    return term
      ? this.registros.filter(r =>
        r.productoId.toString().includes(term) ||
        r.nombre.toLowerCase().includes(term)
      )
      : this.registros;
  }

  /**
 * Captura todas las teclas: acumula en buffer hasta encontrar Enter,
 * luego dispara scanCodigo() con todo lo escaneado.
 */
  private handleScannerKey = (evt: KeyboardEvent) => {
    // Ignora teclas especiales excepto Enter
    if (evt.key === 'Enter') {
      const code = this.scanBuffer.trim();
      this.scanBuffer = '';
      clearTimeout(this.bufferResetTimeout);

      if (code) {
        this.codigoIngresado = code;
        this.scanCodigo();
      }
    } else if (evt.key.length === 1) {
      // solo letras/números/puntuación
      this.scanBuffer += evt.key;
      // si pasa >100ms sin tecla, reinicia buffer
      clearTimeout(this.bufferResetTimeout);
      this.bufferResetTimeout = setTimeout(() => this.scanBuffer = '', 100);
    }
  };

}