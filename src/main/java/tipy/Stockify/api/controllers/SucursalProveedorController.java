package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ProveedorDto;
import tipy.Stockify.dtos.SucursalProveedorDto;
import tipy.Stockify.services.SucursalProveedorService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/sucursal-proveedor")
public class SucursalProveedorController {

    private final SucursalProveedorService sucursalProveedorService;

    public SucursalProveedorController(SucursalProveedorService sucursalProveedorService) {
        this.sucursalProveedorService = sucursalProveedorService;
    }

    @GetMapping("/sucursal/{sucursalId}")
    @Operation(description = "Obtiene la lista de proveedores activos asociados a una sucursal.")
    public ResponseEntity<List<SucursalProveedorDto>> getBySucursalId(@PathVariable Long sucursalId) {
        return new ResponseEntity<>(sucursalProveedorService.getAllBySucursalId(sucursalId), HttpStatus.OK);
    }

    @PostMapping("/sucursal/{sucursalId}")
    @Operation(description = "Crea un nuevo proveedor y su relación con una sucursal.")
    public ResponseEntity<SucursalProveedorDto> create(
            @RequestBody ProveedorDto proveedorDto,
            @PathVariable Long sucursalId) {
        return new ResponseEntity<>(sucursalProveedorService.create(proveedorDto, sucursalId), HttpStatus.CREATED);
    }

    @PutMapping("/proveedor/{proveedorId}")
    @Operation(description = "Modifica un proveedor existente.")
    public ResponseEntity<ProveedorDto> updateProveedor(
            @PathVariable Long proveedorId,
            @RequestBody ProveedorDto proveedorDto) {
        ProveedorDto updated = sucursalProveedorService.updateProveedor(proveedorId, proveedorDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/proveedor/{proveedorId}/activo/{activo}")
    @Operation(description = "Habilita o deshabilita un proveedor.")
    public ResponseEntity<Void> toggleProveedorActivo(
            @PathVariable Long proveedorId,
            @PathVariable boolean activo) {
        sucursalProveedorService.toggleProveedorActivo(proveedorId, activo);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/sucursal/{sucursalId}/proveedor/{proveedorId}")
    @Operation(description = "Crea una relación entre una sucursal y un proveedor existente.")
    public ResponseEntity<SucursalProveedorDto> linkSucursalProveedor(
            @PathVariable Long sucursalId,
            @PathVariable Long proveedorId) {
        return new ResponseEntity<>(sucursalProveedorService.linkSucursalProveedor(sucursalId, proveedorId), HttpStatus.CREATED);
    }
}