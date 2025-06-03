package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.*;
import tipy.Stockify.services.EstadisticaService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Year;
import java.util.List;

@RestController
@RequestMapping("/api/v1/estadisticas")
public class EstadisticaController {

    private final EstadisticaService estadisticaService;

    public EstadisticaController(EstadisticaService estadisticaService) {
        this.estadisticaService = estadisticaService;
    }

    @GetMapping("/productos-vendidos")
    @Operation(description = "Productos más vendidos en rango de fechas")
    public ResponseEntity<List<ProductoVendidosDto>> productosMasVendidos(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaHasta) {

        // Convertir LocalDate a LocalDateTime (desde 00:00:00 hasta 23:59:59)
        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<ProductoVendidosDto> lista =
                estadisticaService.obtenerProductosMasVendidos(desdeDateTime, hastaDateTime);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/productos-faltaron")
    @Operation(description = "Productos con mayor faltante en rango de fechas")
    public ResponseEntity<List<ProductoFaltanteDto>> productosConMayorFaltante(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaHasta) {

        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<ProductoFaltanteDto> lista =
                estadisticaService.obtenerProductosConMayorFaltante(desdeDateTime, hastaDateTime);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/productos-menos-vendidos")
    @Operation(description = "Productos menos vendidos en rango de fechas")
    public ResponseEntity<List<ProductoMenosVendidosDto>> productosMenosVendidos(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaHasta) {

        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<ProductoMenosVendidosDto> lista =
                estadisticaService.obtenerProductosMenosVendidos(desdeDateTime, hastaDateTime);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/dinero-faltante-mes")
    @Operation(description = "Dinero faltante por MES para un año completo")
    public ResponseEntity<List<DineroFaltanteMesDto>> dineroFaltantePorMes(
            @RequestParam("anio") Integer anio) {

        List<DineroFaltanteMesDto> lista = estadisticaService.obtenerDineroFaltantePorMes(anio);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/categorias-vendidas")
    @Operation(description = "Categorías más vendidas en rango de fechas")
    public ResponseEntity<List<CategoriaVendidaDto>> categoriasMasVendidas(
            @RequestParam("fechaDesde")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam("fechaHasta")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        // Convertimos LocalDate → LocalDateTime (inicio del día y fin del día)
        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<CategoriaVendidaDto> resultado =
                estadisticaService.obtenerCategoriasMasVendidas(desdeDateTime, hastaDateTime);

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/dinero-sobrante-mes")
    @Operation(description = "Dinero sobrante por mes (año dado)")
    public ResponseEntity<List<DineroSobranteMesDto>> dineroSobrantePorMes(
            @RequestParam("anio") Integer anio
    ) {
        return ResponseEntity.ok(estadisticaService.obtenerDineroSobrantePorMes(anio));
    }
}
