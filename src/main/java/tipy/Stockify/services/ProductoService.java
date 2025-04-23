package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Categoria;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.repositories.CategoriaRepository;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.dtos.ProductoDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final SucursalRepository sucursalRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService(ProductoRepository productoRepository, SucursalRepository sucursalRepository, CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.sucursalRepository = sucursalRepository;
        this.categoriaRepository = categoriaRepository;
    }

    public List<ProductoDto> getAllActive() {
        return productoRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProductoDto> getAllIncludingInactive() {
        return productoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductoDto getById(Long id) {
        return productoRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ProductoDto create(ProductoDto productoDto) {
        Producto producto = mapToEntity(productoDto);
        // Asegurar que activo sea true para nuevos productos, incluso si no se especifica
        producto.setActivo(true);
        return mapToDto(productoRepository.save(producto));
    }

    public ProductoDto update(Long id, ProductoDto productoDto) {
        return productoRepository.findById(id)
                .map(existingProducto -> {
                    updateProductoFields(existingProducto, productoDto);
                    return mapToDto(productoRepository.save(existingProducto));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado con id: " + id));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    private void updateProductoFields(Producto producto, ProductoDto productoDto) {
        if (productoDto.getCodigoBarra() != null) {
            producto.setCodigoBarra(productoDto.getCodigoBarra());
        }
        if (productoDto.getImagen() != null) {
            producto.setImagen(productoDto.getImagen());
        }
        if (productoDto.getNombre() != null) {
            producto.setNombre(productoDto.getNombre());
        }
        if (productoDto.getDetalle() != null) {
            producto.setDetalle(productoDto.getDetalle());
        }
        if (productoDto.getPrecio() != null) {
            producto.setPrecio(productoDto.getPrecio());
        }
        if (productoDto.getCantidadStock() != null) {
            producto.setCantidadStock(productoDto.getCantidadStock());
        }
        if (productoDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(productoDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + productoDto.getSucursalId()));
            producto.setSucursal(sucursal);
        }
        if (productoDto.getCategoriaId() != null) {
            Categoria categoria = categoriaRepository.findById(productoDto.getCategoriaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada con id: " + productoDto.getCategoriaId()));
            producto.setCategoria(categoria);
        }
        if (productoDto.getActivo() != null) {
            producto.setActivo(productoDto.getActivo());
        }
    }

    public Producto mapToEntity(ProductoDto productoDto) {
        Producto producto = new Producto();
        producto.setCodigoBarra(productoDto.getCodigoBarra());
        producto.setImagen(productoDto.getImagen());
        producto.setNombre(productoDto.getNombre());
        producto.setDetalle(productoDto.getDetalle());
        producto.setPrecio(productoDto.getPrecio());
        producto.setCantidadStock(productoDto.getCantidadStock());
        if (productoDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(productoDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + productoDto.getSucursalId()));
            producto.setSucursal(sucursal);
        }
        if (productoDto.getCategoriaId() != null) {
            Categoria categoria = categoriaRepository.findById(productoDto.getCategoriaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada con id: " + productoDto.getCategoriaId()));
            producto.setCategoria(categoria);
        }
        //activo se establece explícitamente en los métodos create/update
        return producto;
    }

    public ProductoDto mapToDto(Producto producto) {
        ProductoDto productoDto = new ProductoDto();
        productoDto.setId(producto.getId());
        productoDto.setCodigoBarra(producto.getCodigoBarra());
        productoDto.setImagen(producto.getImagen());
        productoDto.setNombre(producto.getNombre());
        productoDto.setDetalle(producto.getDetalle());
        productoDto.setPrecio(producto.getPrecio());
        productoDto.setCantidadStock(producto.getCantidadStock());
        productoDto.setSucursalId(producto.getSucursal() != null ? producto.getSucursal().getId() : null);
        productoDto.setCategoriaId(producto.getCategoria() != null ? producto.getCategoria().getId() : null);
        productoDto.setActivo(producto.isActivo());
        return productoDto;
    }
}