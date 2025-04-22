package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ConteoProductoDto;
import tipy.Stockify.services.ConteoProductoService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/conteoproducto")
public class ConteoProductoController {

    private final ConteoProductoService conteoProductoService;

    public ConteoProductoController(ConteoProductoService conteoProductoService) {
        this.conteoProductoService = conteoProductoService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de conteos de producto.")
    public ResponseEntity<List<ConteoProductoDto>> getConteoProductos() {
        return new ResponseEntity<>(conteoProductoService.getAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un conteo de producto por su ID.")
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
    @Operation(description = "Elimina un conteo de producto por su ID.")
    public ResponseEntity<Void> deleteConteoProducto(@PathVariable Integer id) {
        conteoProductoService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}