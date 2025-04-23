package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ConteoDto;
import tipy.Stockify.services.ConteoService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/conteos")
public class ConteoController {

    private final ConteoService conteoService;

    public ConteoController(ConteoService conteoService) {
        this.conteoService = conteoService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de conteos activos.")
    public ResponseEntity<List<ConteoDto>> getActiveConteos() {
        return new ResponseEntity<>(conteoService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los conteos, incluidos los inactivos.")
    public ResponseEntity<List<ConteoDto>> getAllConteosIncludingInactive() {
        return new ResponseEntity<>(conteoService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un conteo activo por su ID.")
    public ResponseEntity<ConteoDto> getConteoById(@PathVariable Long id) {
        ConteoDto conteo = conteoService.getById(id);
        return conteo != null
                ? new ResponseEntity<>(conteo, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo conteo.")
    public ResponseEntity<ConteoDto> createConteo(@RequestBody ConteoDto conteoDto) {
        return new ResponseEntity<>(conteoService.create(conteoDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un conteo existente.")
    public ResponseEntity<ConteoDto> updateConteo(@PathVariable Long id, @RequestBody ConteoDto conteoDto) {
        ConteoDto updated = conteoService.update(id, conteoDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un conteo por su ID.")
    public ResponseEntity<Void> deactivateConteo(@PathVariable Long id) {
        conteoService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}