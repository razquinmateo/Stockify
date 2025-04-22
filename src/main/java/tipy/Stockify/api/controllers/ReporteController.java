package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ReporteDto;
import tipy.Stockify.services.ReporteService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de reportes.")
    public ResponseEntity<List<ReporteDto>> getReportes() {
        return new ResponseEntity<>(reporteService.getAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un reporte por su ID.")
    public ResponseEntity<ReporteDto> getReporteById(@PathVariable Long id) {
        ReporteDto reporte = reporteService.getById(id);
        return reporte != null
                ? new ResponseEntity<>(reporte, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo reporte.")
    public ResponseEntity<ReporteDto> createReporte(@RequestBody ReporteDto reporteDto) {
        return new ResponseEntity<>(reporteService.create(reporteDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un reporte existente.")
    public ResponseEntity<ReporteDto> updateReporte(@PathVariable Long id, @RequestBody ReporteDto reporteDto) {
        ReporteDto updated = reporteService.update(id, reporteDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Elimina un reporte por su ID.")
    public ResponseEntity<Void> deleteReporte(@PathVariable Long id) {
        reporteService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}