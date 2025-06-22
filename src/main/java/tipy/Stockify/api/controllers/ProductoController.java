package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tipy.Stockify.dtos.ProductoDto;
import tipy.Stockify.services.ProductoService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "api/v1/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de productos activos.")
    public ResponseEntity<List<ProductoDto>> getActiveProductos() {
        return new ResponseEntity<>(productoService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los productos, incluidos los inactivos.")
    public ResponseEntity<List<ProductoDto>> getAllProductosIncludingInactive() {
        return new ResponseEntity<>(productoService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/sucursal/{sucursalId}/activos")
    @Operation(description = "Obtiene la lista de productos activos asociados a una sucursal.")
    public ResponseEntity<List<ProductoDto>> getActiveProductosBySucursal(@PathVariable Long sucursalId) {
        return new ResponseEntity<>(productoService.getAllActiveBySucursalId(sucursalId), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un producto activo por su ID.")
    public ResponseEntity<ProductoDto> getProductoById(@PathVariable Long id) {
        ProductoDto producto = productoService.getById(id);
        return producto != null
                ? new ResponseEntity<>(producto, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/codigo/{codigoProducto}")
    @Operation(description = "Obtiene un producto activo por su código de producto.")
    public ResponseEntity<ProductoDto> getProductoByCodigoProducto(@PathVariable String codigoProducto) {
        ProductoDto producto = productoService.getByCodigoProducto(codigoProducto);
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
    @Operation(description = "Desactiva un producto por su ID.")
    public ResponseEntity<Void> deactivateProducto(@PathVariable Long id) {
        productoService.deactivate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/actualizar-masivo")
    @Operation(description = "Actualiza masivamente productos por código de barra (precio y stock).")
    public ResponseEntity<Map<String, String>> actualizarMasivo(@RequestBody List<ProductoDto> productos) {
        for (ProductoDto dto : productos) {
            if (dto.getCodigosBarra() != null && !dto.getCodigosBarra().isEmpty()) {
                productoService.actualizarStockYPrecioPorCodigoBarra(dto.getCodigosBarra().get(0), dto.getPrecio(), dto.getCantidadStock());
            }
        }
        return ResponseEntity.ok(Map.of("mensaje", "Productos actualizados correctamente."));
    }
}