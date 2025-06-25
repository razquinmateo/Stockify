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
    @Operation(description = "Obtiene la lista de proveedores activos.")
    public ResponseEntity<List<ProveedorDto>> getActiveProveedores() {
        return new ResponseEntity<>(proveedorService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los proveedores, incluidos los inactivos.")
    public ResponseEntity<List<ProveedorDto>> getAllProveedoresIncludingInactive() {
        return new ResponseEntity<>(proveedorService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/sucursal/{sucursalId}/activos")
    @Operation(description = "Obtiene la lista de proveedores activos asociados a productos de una sucursal.")
    public ResponseEntity<List<ProveedorDto>> getActiveProveedoresBySucursal(@PathVariable Long sucursalId) {
        return new ResponseEntity<>(proveedorService.getAllActiveBySucursalId(sucursalId), HttpStatus.OK);
    }

    @GetMapping("/sucursal/{sucursalId}")
    @Operation(description = "Obtiene la lista de proveedores asociados a productos de una sucursal.")
    public ResponseEntity<List<ProveedorDto>> getAllBySucursal(@PathVariable Long sucursalId) {
        return new ResponseEntity<>(proveedorService.getAllBySucursalId(sucursalId), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un proveedor activo por su ID.")
    public ResponseEntity<ProveedorDto> getProveedorById(@PathVariable Long id) {
        ProveedorDto proveedor = proveedorService.getById(id);
        return proveedor != null
                ? new ResponseEntity<>(proveedor, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/nombre/{nombre}")
    @Operation(description = "Obtiene un proveedor activo por su nombre.")
    public ResponseEntity<ProveedorDto> getProveedorByNombre(@PathVariable String nombre) {
        ProveedorDto proveedor = proveedorService.getByNombre(nombre);
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

    @PutMapping("/{id}/activo/{activo}")
    @Operation(description = "Activa o desactiva un proveedor por su ID.")
    public ResponseEntity<Void> toggleProveedorActivo(@PathVariable Long id, @PathVariable Boolean activo) {
        proveedorService.toggleActive(id, activo);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un proveedor por su ID.")
    public ResponseEntity<Void> deactivateProveedor(@PathVariable Long id) {
        proveedorService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}