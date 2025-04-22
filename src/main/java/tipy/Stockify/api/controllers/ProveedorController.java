package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ProveedorDto;
import tipy.Stockify.services.ProveedorService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de proveedores.")
    public ResponseEntity<List<ProveedorDto>> getProveedores() {
        return new ResponseEntity<>(proveedorService.getAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un proveedor por su ID.")
    public ResponseEntity<ProveedorDto> getProveedorById(@PathVariable Long id) {
        ProveedorDto proveedor = proveedorService.getById(id);
        return proveedor != null
                ? new ResponseEntity<>(proveedor, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo proveedor.")
    public ResponseEntity<ProveedorDto> createProveedor(@RequestBody ProveedorDto proveedorDto) {
        return new ResponseEntity<>(proveedorService.create(proveedorDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un proveedor existente.")
    public ResponseEntity<ProveedorDto> updateProveedor(@PathVariable Long id, @RequestBody ProveedorDto proveedorDto) {
        ProveedorDto updated = proveedorService.update(id, proveedorDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Elimina un proveedor por su ID.")
    public ResponseEntity<Void> deleteProveedor(@PathVariable Long id) {
        proveedorService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}