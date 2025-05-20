import { Router } from "@angular/router";
import { RouterModule } from "@angular/router";
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ConteoService, Conteo } from "../../services/conteo.service";
import { UsuarioService, Usuario } from "../../services/usuario.service";
import { AuthService } from "../../auth.service";
import Swal from "sweetalert2";
import { formatDate } from "@angular/common";

declare var bootstrap: any;

@Component({
  selector: "app-gestionar-conteos",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./gestionar-conteos.component.html",
  styleUrls: ["./gestionar-conteos.component.css"],
})
export class GestionarConteosComponent implements OnInit {
  conteos: Conteo[] = [];
  usuarios: Usuario[] = [];
  conteoSeleccionado!: Conteo;
  esEditar: boolean = false;

  filtro: string = "";
  paginaActual: number = 1;
  conteosPorPagina: number = 5;
  nombreUsuarioLogueado: string = "";

  constructor(
    private conteoService: ConteoService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.conteoSeleccionado = this.resetConteo();
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();

    // Primero se cargan los usuarios
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        // Solo despues de tener los usuarios se cargan los conteos
        this.cargarConteos();
      },
      error: (err) => console.error("Error al cargar usuarios", err),
    });
  }

  cargarConteos(): void {
    const sucursalId = this.authService.getSucursalId();

    this.conteoService.obtenerTodosLosConteos().subscribe({
      next: (data) => {
        // Obtiene los ids de los usuarios de la misma sucursal
        const usuariosMismaSucursal = this.usuarios.filter(
          (u) => u.sucursalId === sucursalId
        );
        const idsUsuarios = usuariosMismaSucursal.map((u) => u.id);

        // Filtra los conteos que tengan usuarioId en esa lista
        this.conteos = data.filter((c) => idsUsuarios.includes(c.usuarioId));
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los conteos. Inténtalo de nuevo.",
        });
      },
    });
  }

  getNombreUsuarioPorId(id: number): string {
    const usuario = this.usuarios.find((u) => u.id === id);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : "";
  }

  resetConteo(): Conteo {
    return {
      id: 0,
      fechaHora: "",
      conteoFinalizado: false,
      usuarioId: 0,
      activo: true,
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  mostrarModal(): void {
    const modal = new bootstrap.Modal(document.getElementById("conteoModal"));
    modal.show();
  }

  editarConteo(cont: Conteo): void {
    this.esEditar = true;
    this.conteoSeleccionado = { ...cont };
    this.mostrarModal();
  }

  guardarConteo(): void {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("conteoModal")
    );

    if (this.esEditar) {
      this.conteoService.actualizarConteo(this.conteoSeleccionado).subscribe({
        next: () => {
          modal.hide();
          Swal.fire("Actualizado", "El conteo ha sido actualizado", "success");
          this.cargarConteos();
        },
        error: () => {
          Swal.fire("Error", "No se pudo actualizar el conteo", "error");
        },
      });
    } else {
      this.conteoService.agregarConteo(this.conteoSeleccionado).subscribe({
        next: () => {
          modal.hide();
          Swal.fire("Agregado", "El conteo ha sido agregado", "success");
          this.cargarConteos();
        },
        error: () => {
          Swal.fire("Error", "No se pudo agregar el conteo", "error");
        },
      });
    }
  }

  finalizarConteo(conteo: Conteo): void {
    Swal.fire({
      title: "¿Finalizar conteo?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        conteo.conteoFinalizado = true;

        this.conteoService.actualizarConteo(conteo).subscribe({
          next: () => {
            Swal.fire({
              icon: "success",
              title: "Conteo finalizado",
              text: "El conteo ha sido marcado como finalizado correctamente.",
              timer: 2000,
              showConfirmButton: false,
            });

            this.cargarConteos(); // Actualizás la lista
          },
          error: () => {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudo finalizar el conteo.",
            });
          },
        });
      }
    });
  }

  filtrarConteos(): Conteo[] {
    const filtroLower = this.filtro.toLowerCase();

    return this.conteos
      .filter((cont) => {
        const fechaFormateada = cont.fechaHora
          ? formatDate(cont.fechaHora, "dd/MM/yyyy", "en-US")
          : "";

        const nombreUsuario = this.getNombreUsuarioPorId(
          cont.usuarioId
        ).toLowerCase();

        return (
          nombreUsuario.includes(filtroLower) ||
          fechaFormateada.toLowerCase().includes(filtroLower)
        );
      })
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }

  obtenerConteosPaginados(): Conteo[] {
    const inicio = (this.paginaActual - 1) * this.conteosPorPagina;
    return this.filtrarConteos().slice(inicio, inicio + this.conteosPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.filtrarConteos().length / this.conteosPorPagina);
  }

  empezarConteo(): void {
    console.log("Empezar conteo...");
    // Lógica para iniciar un nuevo conteo
  }

  unirseConteo(): void {
    console.log("Unirse al conteo...");
    // Lógica para unirse a un conteo activo existente
  }
}
