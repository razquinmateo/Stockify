package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ProductoDto;
import tipy.Stockify.services.ProductoService;

import java.util.List;

@RestController
@RequestMapping(value = "api/v1/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de productos.")
    public ResponseEntity<List<ProductoDto>> getProductos() {
        return new ResponseEntity<>(productoService.getAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un producto por su ID.")
    public ResponseEntity<ProductoDto> getProductoById(@PathVariable Long id) {
        ProductoDto producto = productoService.getById(id);
        return producto != null
                ? new ResponseEntity<>(producto, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo producto.")
    public ResponseEntity<ProductoDto> createProducto(@RequestBody ProductoDto productoDto) {
        return new ResponseEntity<>(productoService.create(productoDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(description = "Modifica un producto existente.")
    public ResponseEntity<ProductoDto> updateProducto(@PathVariable Long id, @RequestBody ProductoDto productoDto) {
        ProductoDto updated = productoService.update(id, productoDto);
        return updated != null
                ? new ResponseEntity<>(updated, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Elimina un producto por su ID.")
    public ResponseEntity<Void> deleteProducto(@PathVariable Long id) {
        productoService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}