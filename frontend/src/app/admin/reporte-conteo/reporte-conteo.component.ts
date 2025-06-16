import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConteoProductoService, ConteoProducto } from '../../services/conteo-producto.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@angular/common';

interface ReporteItem {
  id: number;
  producto: string;
  concepto: string;
  stock: number;
  cantidadContada: number | null;
  diferencia: number;
}

@Component({
  selector: 'app-reporte-conteo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-conteo.component.html',
  styleUrls: ['./reporte-conteo.component.css']
})
export class ReporteConteoComponent implements OnInit {
  conteoId: number = 0;
  reporteItems: ReporteItem[] = [];
  ingresosTotales: number = 0;
  egresosTotales: number = 0;
  nombreUsuarioLogueado: string = '';
  conteoFecha: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private conteoProductoService: ConteoProductoService,
    private productoService: ProductoService,
    private conteoService: ConteoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.nombreUsuarioLogueado = this.authService.getUsuarioDesdeToken();
    this.conteoId = +this.route.snapshot.paramMap.get('id')!;
    this.cargarConteo();
    this.cargarReporte();
  }

  cargarConteo(): void {
    this.conteoService.getById(this.conteoId).subscribe({
      next: (conteo: Conteo) => {
        this.conteoFecha = formatDate(conteo.fechaHora, 'dd/MM/yyyy', 'en-US');
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la fecha del conteo.',
        });
      }
    });
  }

  cargarReporte(): void {
    this.conteoProductoService.getConteoProductosByConteoId(this.conteoId).subscribe({
      next: (conteoProductos) => {
        if (conteoProductos.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin datos',
            text: 'No hay productos registrados para este conteo.',
          });
          return;
        }

        const productoIds = conteoProductos.map(cp => cp.productoId);
        this.productoService.obtenerTodosLosProductos().subscribe({
          next: (productos) => {
            const productoMap = new Map<number, Producto>();
            productos.forEach(p => productoMap.set(p.id, p));

            this.reporteItems = conteoProductos.map(cp => {
              const producto = productoMap.get(cp.productoId);
              const diferencia = cp.cantidadContada! - cp.cantidadEsperada!;
              const concepto = diferencia > 0 ? 'Ingreso' : diferencia < 0 ? 'Egreso' : 'Sin diferencia';

              if (diferencia > 0) {
                this.ingresosTotales += diferencia;
              } else if (diferencia < 0) {
                this.egresosTotales += Math.abs(diferencia);
              }

              return {
                id: cp.productoId,
                producto: producto ? producto.nombre : 'Desconocido',
                concepto,
                stock: cp.cantidadEsperada,
                cantidadContada: cp.cantidadContada,
                diferencia
              };
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar los productos.',
            });
          }
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos del conteo.',
        });
      }
    });
  }

  descargarPDF(): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar fuente
    doc.setFont('helvetica', 'normal');

    // Encabezado
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Stockify', 14, 15);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporte de Conteo #${this.conteoId}`, 14, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.conteoFecha || 'No disponible'}`, 14, 33);

    // Línea divisoria
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Tabla
    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Producto', 'Concepto', 'Stock', 'Cant. Contada', 'Diferencia']],
      body: this.reporteItems.map(item => [
        item.id.toString(),
        item.producto,
        item.concepto,
        item.stock.toString(),
        item.cantidadContada?.toString() ?? '0',
        item.diferencia.toString()
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' }
      },
      margin: { top: 45, left: 14, right: 14 },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      didDrawPage: (data) => {
        // Pie de página
        const pageCount = doc.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
        
        // Línea en el pie
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 15, 196, pageHeight - 15);
      }
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Totales:', 14, finalY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Ingresos Totales: ${this.ingresosTotales} unidades`, 14, finalY + 18);
    doc.text(`Egresos Totales: ${this.egresosTotales} unidades`, 14, finalY + 26);

    // Línea divisoria final
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 32, 196, finalY + 32);

    // Guardar PDF
    doc.save(`reporte-conteo-${this.conteoId}.pdf`);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  volver(): void {
    this.router.navigate(['/admin/gestionar-conteos']);
  }
}