package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.EmpresaDto;
import tipy.Stockify.services.EmpresaService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de empresas activas.")
    public ResponseEntity<List<EmpresaDto>> getActiveEmpresas() {
        return new ResponseEntity<>(empresaService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todas las empresas, incluidas las inactivas.")
    public ResponseEntity<List<EmpresaDto>> getAllEmpresasIncludingInactive() {
        return new ResponseEntity<>(empresaService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene una empresa activa por su ID.")
    public ResponseEntity<EmpresaDto> getEmpresaById(@PathVariable Long id) {
        EmpresaDto empresa = empresaService.getById(id);
        return empresa != null
                ? new ResponseEntity<>(empresa, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea una nueva empresa.")
    public ResponseEntity<EmpresaDto> createEmpresa(@RequestBody EmpresaDto empresaDto) {
        return new ResponseEntity<>(empresaService.create(empresaDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica una empresa existente.")
    public ResponseEntity<EmpresaDto> updateEmpresa(@PathVariable Long id, @RequestBody EmpresaDto empresaDto) {
        EmpresaDto updated = empresaService.update(id, empresaDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva una empresa por su ID.")
    public ResponseEntity<Void> deactivateEmpresa(@PathVariable Long id) {
        empresaService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}