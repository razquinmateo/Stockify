import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConteoProductoService, ConteoProducto } from '../../services/conteo-producto.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { ConteoService, Conteo } from '../../services/conteo.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@angular/common';
import * as XLSX from 'xlsx';

interface ReporteItem {
  productoId: number;
  codigoProducto: string;
  producto: string;
  concepto: string;
  stock: number;
  cantidadContada: number | null;
  diferencia: number;
  categoriaId?: number;
}

interface CategoriaReporte {
  id: number;
  nombre: string;
  items: ReporteItem[];
  ingresos: number;
  egresos: number;
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
  tipoConteo: 'LIBRE' | 'CATEGORIAS' | null = null;
  reporteItems: ReporteItem[] = [];
  categoriasReporte: CategoriaReporte[] = [];
  ingresosTotales: number = 0;
  egresosTotales: number = 0;
  nombreUsuarioLogueado: string = '';
  conteoFecha: string = '';
  mostrarModalExportar: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private conteoProductoService: ConteoProductoService,
    private productoService: ProductoService,
    private conteoService: ConteoService,
    private categoriaService: CategoriaService,
    private authService: AuthService
  ) { }

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
        this.tipoConteo = conteo.tipoConteo as 'LIBRE' | 'CATEGORIAS';
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del conteo.',
        });
      }
    });
  }

  cerrarModalExportar() {
    this.mostrarModalExportar = false;
  }

  abrirModalExportar() {
    this.mostrarModalExportar = true;
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

            const sucursalId = this.authService.getSucursalId();
            if (sucursalId == null) {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener el ID de la sucursal.',
              });
              return;
            }

            this.categoriaService.obtenerCategoriasPorSucursal(sucursalId).subscribe({
              next: (categorias) => {
                const categoriaMap = new Map<number, Categoria>();
                categorias.forEach(c => categoriaMap.set(c.id, c));

                this.reporteItems = conteoProductos.map(cp => {
                  const producto = productoMap.get(cp.productoId);
                  const diferencia = cp.cantidadContada! - cp.cantidadEsperada;
                  const concepto = diferencia > 0 ? 'Ingreso' : diferencia < 0 ? 'Egreso' : 'Sin diferencia';

                  if (diferencia > 0) {
                    this.ingresosTotales += diferencia;
                  } else if (diferencia < 0) {
                    this.egresosTotales += Math.abs(diferencia);
                  }

                  return {
                    productoId: cp.productoId,
                    codigoProducto: producto ? producto.codigoProducto : 'N/A',
                    producto: producto ? producto.nombre : 'Desconocido',
                    concepto,
                    stock: cp.cantidadEsperada,
                    cantidadContada: cp.cantidadContada,
                    diferencia,
                    categoriaId: producto?.categoriaId
                  };
                });

                if (this.tipoConteo === 'LIBRE') {
                  this.reporteItems.sort((a, b) => a.productoId - b.productoId);
                }

                if (this.tipoConteo === 'CATEGORIAS') {
                  this.categoriasReporte = categorias
                    .map(c => ({
                      id: c.id,
                      nombre: c.nombre,
                      items: this.reporteItems
                        .filter(item => item.categoriaId === c.id)
                        .sort((a, b) => a.productoId - b.productoId),
                      ingresos: 0,
                      egresos: 0
                    }))
                    .filter(c => c.items.length > 0);

                  this.categoriasReporte.forEach(categoria => {
                    categoria.items.forEach(item => {
                      if (item.diferencia > 0) {
                        categoria.ingresos += item.diferencia;
                      } else if (item.diferencia < 0) {
                        categoria.egresos += Math.abs(item.diferencia);
                      }
                    });
                  });

                  this.categoriasReporte.sort((a, b) => a.nombre.localeCompare(b.nombre));
                }
              },
              error: () => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'No se pudieron cargar las categorías.',
                });
              }
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

  openExportModal(): void {
    const modal = document.getElementById('exportModal');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap.Modal.getOrCreateInstance(modal);
      bootstrapModal.show();
    }
  }

  descargarPDF(): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar márgenes globales
    const marginLeft: number = 14;
    const marginRight: number = 20;
    const marginTop: number = 20;
    const marginBottom: number = 20;
    const pageWidth: number = doc.internal.pageSize.getWidth();
    const pageHeight: number = doc.internal.pageSize.getHeight();
    const usableWidth: number = pageWidth - marginLeft - marginRight;
    const usableHeight: number = pageHeight - marginTop - marginBottom;

    // Configurar fuente
    doc.setFont('helvetica', 'normal');

    // Encabezado (sin cambios)
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, pageWidth, marginTop, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Stockify - Reporte de Inventario', marginLeft, marginTop - 8, { maxWidth: usableWidth });

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporte de Conteo #${this.conteoId}`, marginLeft, marginTop + 10, { maxWidth: usableWidth });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.conteoFecha || 'No disponible'}`, marginLeft, marginTop + 18, { maxWidth: usableWidth });
    doc.text(`Tipo: ${this.tipoConteo === 'CATEGORIAS' ? 'Por rubro' : 'Libre'}`, marginLeft, marginTop + 26, { maxWidth: usableWidth });
    doc.text(`Usuario: ${this.nombreUsuarioLogueado}`, marginLeft, marginTop + 34, { maxWidth: usableWidth });

    // Línea divisoria
    doc.setDrawColor(100);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, marginTop + 40, pageWidth - marginRight, marginTop + 40);

    let finalY: number = marginTop + 50;

    if (this.tipoConteo === 'LIBRE') {
      // Tabla única para LIBRE (sin cambios)
      autoTable(doc, {
        startY: finalY,
        head: [['Código Producto', 'Producto', 'Concepto', 'Stock', 'Cant. Contada', 'Diferencia']],
        body: this.reporteItems.map(item => [
          item.codigoProducto,
          item.producto,
          item.concepto,
          item.stock.toString(),
          item.cantidadContada?.toString() ?? '0',
          item.diferencia.toString()
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [30, 30, 30],
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
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 27, halign: 'center' },
          1: { cellWidth: 55 },
          2: { cellWidth: 27, halign: 'center' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' }
        },
        margin: { top: marginTop + 40, left: marginLeft, right: marginRight, bottom: marginBottom },
        styles: {
          lineColor: [150, 150, 150],
          lineWidth: 0.2
        },
        didDrawPage: (data) => {
          finalY = data.cursor?.y ?? finalY;
        }
      });
      finalY = (doc as any).lastAutoTable.finalY || finalY;
    } else if (this.tipoConteo === 'CATEGORIAS') {
      // Tablas por categoría para CATEGORIAS
      this.categoriasReporte.forEach((categoria, index) => {
        if (categoria.items.length > 0) {
          // Estimar altura requerida para la categoría (título + tabla + totales)
          const titleHeight = 8; // Altura del título
          const totalsHeight = 6 * 2 + 10; // Dos líneas de totales (6mm cada una) + espacio
          const rowHeight = 6; // Altura aproximada por fila (ajusta según tu diseño)
          const headerHeight = 7; // Altura del encabezado de la tabla
          const tableHeight = headerHeight + categoria.items.length * rowHeight; // Altura total de la tabla
          const totalCategoryHeight = titleHeight + tableHeight + totalsHeight + 5; // +5 para espacio adicional

          // Verificar si hay suficiente espacio en la página actual
          const remainingHeight = pageHeight - marginBottom - finalY;
          if (totalCategoryHeight > remainingHeight && finalY > marginTop + 40) {
            doc.addPage();
            finalY = marginTop;
          }

          // Título de la categoría
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(categoria.nombre, marginLeft, finalY, { maxWidth: usableWidth });
          finalY += titleHeight;

          // Tabla de la categoría
          autoTable(doc, {
            startY: finalY,
            head: [['Código Producto', 'Producto', 'Concepto', 'Stock', 'Cant. Contada', 'Diferencia']],
            body: categoria.items.map(item => [
              item.codigoProducto,
              item.producto,
              item.concepto,
              item.stock.toString(),
              item.cantidadContada?.toString() ?? '0',
              item.diferencia.toString()
            ]),
            theme: 'grid',
            headStyles: {
              fillColor: [30, 30, 30],
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
              fillColor: [245, 245, 245]
            },
            columnStyles: {
              0: { cellWidth: 27, halign: 'center' },
              1: { cellWidth: 55 },
              2: { cellWidth: 27, halign: 'center' },
              3: { cellWidth: 22, halign: 'center' },
              4: { cellWidth: 22, halign: 'center' },
              5: { cellWidth: 22, halign: 'center' }
            },
            margin: { left: marginLeft, right: marginRight, bottom: marginBottom },
            styles: {
              lineColor: [150, 150, 150],
              lineWidth: 0.2
            },
            didDrawPage: (data) => {
              finalY = data.cursor?.y ?? finalY;
            }
          });

          finalY = (doc as any).lastAutoTable.finalY || finalY;
          finalY += 5;

          // Totales por categoría
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0);
          doc.text(`Egresos: ${categoria.egresos} unidades`, marginLeft, finalY, { maxWidth: usableWidth });
          finalY += 6;
          doc.text(`Ingresos: ${categoria.ingresos} unidades`, marginLeft, finalY, { maxWidth: usableWidth });
          finalY += 10;

          if (index < this.categoriasReporte.length - 1) {
            finalY += 5;
          }
        }
      });
    }

    // Totales Generales
    // Verificar espacio para totales generales
    const totalsGeneralHeight = 34; // Aproximado para título + 3 líneas
    if (finalY + totalsGeneralHeight > pageHeight - marginBottom) {
      doc.addPage();
      finalY = marginTop;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Totales Generales:', marginLeft, finalY + 10, { maxWidth: usableWidth });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Egresos Totales: ${this.egresosTotales} unidades`, marginLeft, finalY + 18, { maxWidth: usableWidth });
    doc.text(`Ingresos Totales: ${this.ingresosTotales} unidades`, marginLeft, finalY + 26, { maxWidth: usableWidth });
    doc.text(`Diferencia: ${this.ingresosTotales - this.egresosTotales} unidades`, marginLeft, finalY + 34, { maxWidth: usableWidth });

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      this.addFooter(doc, i, pageCount);
    }

    // Guardar PDF
    doc.save(`reporte-conteo-${this.conteoId}.pdf`);
    this.cerrarModalExportar();
  }

  descargarXLS(): void {
    const data = this.reporteItems.map(item => ({
      'Código Producto': item.codigoProducto,
      Producto: item.producto,
      'Cantidad Contada': item.cantidadContada ?? 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);

    // Ancho de las columnas
    ws['!cols'] = [
      { wch: 20 }, // 'Código Producto'
      { wch: 40 }, // 'Producto'
      { wch: 15 }  // 'Cantidad Contada'
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte-conteo-${this.conteoId}.xlsx`);
    this.cerrarModalExportar();
  }

  private addFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
    const marginLeft: number = 14;
    const marginRight: number = 20; // Ajustado a 20 mm
    const pageWidth: number = doc.internal.pageSize.getWidth();
    const pageHeight: number = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Stockify - Reporte de Conteo #${this.conteoId} | Página ${pageNumber} de ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 10,
      { align: 'right' }
    );

    doc.setDrawColor(100);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, pageHeight - 15, pageWidth - marginRight, pageHeight - 15);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  volver(): void {
    this.router.navigate(['/admin/gestionar-conteos']);
  }
}