package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.LoteDto;
import tipy.Stockify.services.LoteService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/lotes")
public class LoteController {

    private static final Logger logger = LoggerFactory.getLogger(LoteController.class);
    private final LoteService loteService;

    public LoteController(LoteService loteService) {
        this.loteService = loteService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de lotes activos.")
    public ResponseEntity<List<LoteDto>> getActiveLotes() {
        logger.info("Solicitando lista de lotes activos");
        return new ResponseEntity<>(loteService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los lotes, incluidos los inactivos.")
    public ResponseEntity<List<LoteDto>> getAllLotesIncludingInactive() {
        logger.info("Solicitando lista de todos los lotes, incluidos inactivos");
        return new ResponseEntity<>(loteService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/sucursal/{sucursalId}")
    @Operation(description = "Obtiene la lista de lotes asociados a una sucursal.")
    public ResponseEntity<List<LoteDto>> getLotesBySucursal(@PathVariable Long sucursalId) {
        logger.info("Solicitando lotes para sucursalId: {}", sucursalId);
        return new ResponseEntity<>(loteService.getAllBySucursal(sucursalId), HttpStatus.OK);
    }

    @GetMapping("/sucursal/{sucursalId}/activos")
    @Operation(description = "Obtiene la lista de lotes activos asociados a una sucursal.")
    public ResponseEntity<List<LoteDto>> getActiveLotesBySucursal(@PathVariable Long sucursalId) {
        logger.info("Solicitando lotes activos para sucursalId: {}", sucursalId);
        return new ResponseEntity<>(loteService.getAllActiveBySucursal(sucursalId), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un lote activo por su ID.")
    public ResponseEntity<LoteDto> getLoteById(@PathVariable Long id) {
        logger.info("Solicitando lote con id: {}", id);
        LoteDto lote = loteService.getById(id);
        return lote != null
                ? new ResponseEntity<>(lote, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo lote.")
    public ResponseEntity<LoteDto> createLote(@RequestBody LoteDto loteDto) {
        logger.info("Creando nuevo lote: {}", loteDto.getNumeroLote());
        return new ResponseEntity<>(loteService.create(loteDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un lote existente.")
    public ResponseEntity<LoteDto> updateLote(@PathVariable Long id, @RequestBody LoteDto loteDto) {
        logger.info("Actualizando lote con id: {}", id);
        LoteDto updated = loteService.update(id, loteDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un lote por su ID.")
    public ResponseEntity<Void> deactivateLote(@PathVariable Long id) {
        logger.info("Desactivando lote con id: {}", id);
        loteService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}