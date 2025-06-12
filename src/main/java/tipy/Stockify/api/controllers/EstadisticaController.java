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
import java.util.List;

@RestController
@RequestMapping("/api/v1/estadisticas")
public class EstadisticaController {

    private final EstadisticaService estadisticaService;

    public EstadisticaController(EstadisticaService estadisticaService) {
        this.estadisticaService = estadisticaService;
    }

    @GetMapping("/productos-faltaron")
    @Operation(description = "Productos con mayor faltante en rango de fechas por sucursal")
    public ResponseEntity<List<ProductoFaltanteDto>> productosConMayorFaltante(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam("sucursalId") Long sucursalId) {

        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<ProductoFaltanteDto> lista = estadisticaService.obtenerProductosConMayorFaltante(desdeDateTime, hastaDateTime, sucursalId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/productos-sobrantes")
    @Operation(description = "Productos con mayor sobrante en rango de fechas por sucursal")
    public ResponseEntity<List<ProductoSobranteDto>> productosConMayorSobrante(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam("sucursalId") Long sucursalId) {

        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<ProductoSobranteDto> lista = estadisticaService.obtenerProductosConMayorSobrante(desdeDateTime, hastaDateTime, sucursalId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/dinero-faltante-mes")
    @Operation(description = "Dinero faltante por mes para un año completo por sucursal")
    public ResponseEntity<List<DineroFaltanteMesDto>> dineroFaltantePorMes(
            @RequestParam("anio") Integer anio,
            @RequestParam("sucursalId") Long sucursalId) {

        List<DineroFaltanteMesDto> lista = estadisticaService.obtenerDineroFaltantePorMes(anio, sucursalId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/dinero-sobrante-mes")
    @Operation(description = "Dinero sobrante por mes para un año completo por sucursal")
    public ResponseEntity<List<DineroSobranteMesDto>> dineroSobrantePorMes(
            @RequestParam("anio") Integer anio,
            @RequestParam("sucursalId") Long sucursalId) {

        List<DineroSobranteMesDto> lista = estadisticaService.obtenerDineroSobrantePorMes(anio, sucursalId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/categorias-faltantes")
    @Operation(description = "Categorías con mayor faltante en rango de fechas por sucursal")
    public ResponseEntity<List<CategoriaFaltanteDto>> categoriasConMayorFaltante(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam("sucursalId") Long sucursalId) {

        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<CategoriaFaltanteDto> lista = estadisticaService.obtenerCategoriasConMayorFaltante(desdeDateTime, hastaDateTime, sucursalId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/categorias-sobrantes")
    @Operation(description = "Categorías con mayor sobrante en rango de fechas por sucursal")
    public ResponseEntity<List<CategoriaSobranteDto>> categoriasConMayorSobrante(
            @RequestParam("fechaDesde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam("fechaHasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam("sucursalId") Long sucursalId) {

        LocalDateTime desdeDateTime = fechaDesde.atStartOfDay();
        LocalDateTime hastaDateTime = fechaHasta.atTime(LocalTime.MAX);

        List<CategoriaSobranteDto> lista = estadisticaService.obtenerCategoriasConMayorSobrante(desdeDateTime, hastaDateTime, sucursalId);
        return ResponseEntity.ok(lista);
    }
}