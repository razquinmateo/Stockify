package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.CategoriaDto;
import tipy.Stockify.services.CategoriaService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "api/v1/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de categorías activas.")
    public ResponseEntity<List<CategoriaDto>> getActiveCategorias() {
        return new ResponseEntity<>(categoriaService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todas las categorías, incluidas las inactivas.")
    public ResponseEntity<List<CategoriaDto>> getAllCategoriasIncludingInactive() {
        return new ResponseEntity<>(categoriaService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene una categoría activa por su ID.")
    public ResponseEntity<CategoriaDto> getCategoriaById(@PathVariable Long id) {
        CategoriaDto categoria = categoriaService.getById(id);
        return categoria != null
                ? new ResponseEntity<>(categoria, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea una nueva categoría.")
    public ResponseEntity<CategoriaDto> createCategoria(@RequestBody CategoriaDto categoriaDto) {
        return new ResponseEntity<>(categoriaService.create(categoriaDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica una categoría existente.")
    public ResponseEntity<CategoriaDto> updateCategoria(@PathVariable Long id, @RequestBody CategoriaDto categoriaDto) {
        CategoriaDto updated = categoriaService.update(id, categoriaDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva una categoría por su ID.")
    public ResponseEntity<Void> deactivateCategoria(@PathVariable Long id) {
        categoriaService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/sucursal/{sucursalId}")
    @Operation(description = "Obtiene la lista de categorías activas por sucursal.")
    public ResponseEntity<List<CategoriaDto>> getCategoriasBySucursal(@PathVariable Long sucursalId) {
        return new ResponseEntity<>(
                categoriaService.getAllActive().stream()
                        .filter(c -> c.getSucursalId().equals(sucursalId))
                        .collect(Collectors.toList()),
                HttpStatus.OK
        );
    }
}