package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.CategoriaDto;
import tipy.Stockify.services.CategoriaService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de categorías.")
    public ResponseEntity<List<CategoriaDto>> getCategorias() {
        return new ResponseEntity<>(categoriaService.getAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene una categoría por su ID.")
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
    @Operation(description = "Elimina una categoría por su ID.")
    public ResponseEntity<Void> deleteCategoria(@PathVariable Long id) {
        categoriaService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}