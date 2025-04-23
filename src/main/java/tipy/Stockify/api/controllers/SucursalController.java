package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.SucursalDto;
import tipy.Stockify.services.SucursalService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/sucursales")
public class SucursalController {

    private final SucursalService sucursalService;

    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de sucursales activas.")
    public ResponseEntity<List<SucursalDto>> getActiveSucursales() {
        return new ResponseEntity<>(sucursalService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todas las sucursales, incluidas las inactivas.")
    public ResponseEntity<List<SucursalDto>> getAllSucursalesIncludingInactive() {
        return new ResponseEntity<>(sucursalService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene una sucursal activa por su ID.")
    public ResponseEntity<SucursalDto> getSucursalById(@PathVariable Long id) {
        SucursalDto sucursal = sucursalService.getById(id);
        return sucursal != null
                ? new ResponseEntity<>(sucursal, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea una nueva sucursal.")
    public ResponseEntity<SucursalDto> createSucursal(@RequestBody SucursalDto sucursalDto) {
        return new ResponseEntity<>(sucursalService.create(sucursalDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica una sucursal existente.")
    public ResponseEntity<SucursalDto> updateSucursal(@PathVariable Long id, @RequestBody SucursalDto sucursalDto) {
        SucursalDto updated = sucursalService.update(id, sucursalDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva una sucursal por su ID.")
    public ResponseEntity<Void> deactivateSucursal(@PathVariable Long id) {
        sucursalService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}