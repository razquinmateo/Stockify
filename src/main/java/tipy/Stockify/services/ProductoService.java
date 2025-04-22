package tipy.Stockify.services;

import org.springframework.stereotype.Service;
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

    public List<ProductoDto> getAll() {
        return productoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductoDto getById(Long id) {
        return productoRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ProductoDto create(ProductoDto productoDto) {
        Producto producto = mapToEntity(productoDto);
        return mapToDto(productoRepository.save(producto));
    }

    public ProductoDto update(Long id, ProductoDto productoDto) {
        if (productoRepository.existsById(id)) {
            Producto producto = mapToEntity(productoDto);
            producto.setId(id);
            return mapToDto(productoRepository.save(producto));
        }
        return null;
    }

    public void delete(Long id) {
        productoRepository.deleteById(id);
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
                    .orElse(null);
            producto.setSucursal(sucursal);
        }
        if (productoDto.getCategoriaId() != null) {
            Categoria categoria = categoriaRepository.findById(productoDto.getCategoriaId())
                    .orElse(null);
            producto.setCategoria(categoria);
        }
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
        return productoDto;
    }
}