package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tipy.Stockify.business.entities.Conteo;
import tipy.Stockify.business.repositories.ConteoRepository;
import tipy.Stockify.dtos.ConteoProductoDto;
import tipy.Stockify.services.ConteoProductoService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "api/v1/conteoproducto")
public class ConteoProductoController {

    private final ConteoProductoService conteoProductoService;
    private final ConteoRepository conteoRepository;

    public ConteoProductoController(ConteoProductoService conteoProductoService, ConteoRepository conteoRepository) {
        this.conteoProductoService = conteoProductoService;
        this.conteoRepository = conteoRepository;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de conteos de producto activos.")
    public ResponseEntity<List<ConteoProductoDto>> getActiveConteoProductos() {
        return new ResponseEntity<>(conteoProductoService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los conteos de producto, incluidos los inactivos.")
    public ResponseEntity<List<ConteoProductoDto>> getAllConteoProductosIncludingInactive() {
        return new ResponseEntity<>(conteoProductoService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/conteo/{conteoId}")
    @Operation(description = "Obtiene la lista de conteos de producto por ID de conteo, solo si el conteo está inactivo.")
    public ResponseEntity<List<ConteoProductoDto>> getConteoProductosByConteoId(@PathVariable Long conteoId) {
        Conteo conteo = conteoRepository.findById(conteoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteo no encontrado con id: " + conteoId));

        if (conteo.isActivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El reporte solo está disponible para conteos inactivos.");
        }

        List<ConteoProductoDto> conteoProductos = conteoProductoService.getAllIncludingInactive()
                .stream()
                .filter(cp -> cp.getConteoId().equals(conteoId))
                .collect(Collectors.toList());
        return new ResponseEntity<>(conteoProductos, HttpStatus.OK);
    }


    @GetMapping("/{id}")
    @Operation(description = "Obtiene un conteo de producto activo por su ID.")
    public ResponseEntity<ConteoProductoDto> getConteoProductoById(@PathVariable Integer id) {
        ConteoProductoDto conteoProducto = conteoProductoService.getById(id);
        return conteoProducto != null
                ? new ResponseEntity<>(conteoProducto, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo conteo de producto.")
    public ResponseEntity<ConteoProductoDto> createConteoProducto(@RequestBody ConteoProductoDto conteoProductoDto) {
        return new ResponseEntity<>(conteoProductoService.create(conteoProductoDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un conteo de producto existente.")
    public ResponseEntity<ConteoProductoDto> updateConteoProducto(@PathVariable Integer id, @RequestBody ConteoProductoDto conteoProductoDto) {
        ConteoProductoDto updated = conteoProductoService.update(id, conteoProductoDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un conteo de producto por su ID.")
    public ResponseEntity<Void> deactivateConteoProducto(@PathVariable Integer id) {
        conteoProductoService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}