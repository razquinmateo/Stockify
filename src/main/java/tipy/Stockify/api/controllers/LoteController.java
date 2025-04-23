package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.LoteDto;
import tipy.Stockify.services.LoteService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/lotes")
public class LoteController {

    private final LoteService loteService;

    public LoteController(LoteService loteService) {
        this.loteService = loteService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de lotes activos.")
    public ResponseEntity<List<LoteDto>> getActiveLotes() {
        return new ResponseEntity<>(loteService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los lotes, incluidos los inactivos.")
    public ResponseEntity<List<LoteDto>> getAllLotesIncludingInactive() {
        return new ResponseEntity<>(loteService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un lote activo por su ID.")
    public ResponseEntity<LoteDto> getLoteById(@PathVariable Long id) {
        LoteDto lote = loteService.getById(id);
        return lote != null
                ? new ResponseEntity<>(lote, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo lote.")
    public ResponseEntity<LoteDto> createLote(@RequestBody LoteDto loteDto) {
        return new ResponseEntity<>(loteService.create(loteDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un lote existente.")
    public ResponseEntity<LoteDto> updateLote(@PathVariable Long id, @RequestBody LoteDto loteDto) {
        LoteDto updated = loteService.update(id, loteDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un lote por su ID.")
    public ResponseEntity<Void> deactivateLote(@PathVariable Long id) {
        loteService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}