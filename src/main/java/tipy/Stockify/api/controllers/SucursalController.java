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
    @Operation(description = "Obtiene la lista de sucursales.")
    public ResponseEntity<List<SucursalDto>> getSucursales() {
        return new ResponseEntity<>(sucursalService.getAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene una sucursal por su ID.")
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
    @Operation(description = "Elimina una sucursal por su ID.")
    public ResponseEntity<Void> deleteSucursal(@PathVariable Long id) {
        sucursalService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}