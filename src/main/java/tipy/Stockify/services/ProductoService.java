package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Categoria;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.entities.Proveedor;
import tipy.Stockify.business.repositories.CategoriaRepository;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.business.repositories.ProveedorRepository;
import tipy.Stockify.dtos.ProductoDto;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final SucursalRepository sucursalRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;

    public ProductoService(
            ProductoRepository productoRepository,
            SucursalRepository sucursalRepository,
            CategoriaRepository categoriaRepository,
            ProveedorRepository proveedorRepository) {
        this.productoRepository = productoRepository;
        this.sucursalRepository = sucursalRepository;
        this.categoriaRepository = categoriaRepository;
        this.proveedorRepository = proveedorRepository;
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

    public List<ProductoDto> getAllActiveBySucursalId(Long sucursalId) {
        return productoRepository.findBySucursalIdAndActivoTrue(sucursalId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductoDto getById(Long id) {
        return productoRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ProductoDto create(ProductoDto productoDto) {
        validateProductoDto(productoDto);
        Producto producto = mapToEntity(productoDto);
        producto.setActivo(true);
        assignProveedores(producto, productoDto.getProveedorIds());
        return mapToDto(productoRepository.save(producto));
    }

    public ProductoDto update(Long id, ProductoDto productoDto) {
        validateProductoDto(productoDto);
        return productoRepository.findById(id)
                .map(existingProducto -> {
                    updateProductoFields(existingProducto, productoDto);
                    assignProveedores(existingProducto, productoDto.getProveedorIds());
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

    private void validateProductoDto(ProductoDto productoDto) {
        if (productoDto.getImagen() != null && !productoDto.getImagen().isEmpty()) {
            try {
                if (!productoDto.getImagen().matches("data:image/(jpeg|png);base64,.+")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen debe ser un base64 válido de tipo JPEG o PNG");
                }
                String base64Data = productoDto.getImagen().split(",")[1];
                byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                if (decodedBytes.length > 5_000_000) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen no debe exceder 5MB");
                }
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de imagen base64 inválido");
            }
        }
        if (productoDto.getNombre() == null || productoDto.getNombre().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del producto es requerido");
        }
        if (productoDto.getCodigoBarra() == null || productoDto.getCodigoBarra().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código de barra es requerido");
        }
        if (productoDto.getPrecio() == null || productoDto.getPrecio() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor o igual a 0");
        }
        if (productoDto.getCantidadStock() == null || productoDto.getCantidadStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock debe ser mayor o igual a 0");
        }
    }

    private void assignProveedores(Producto producto, List<Long> proveedorIds) {
        if (proveedorIds != null) {
            // Limpiar proveedores existentes
            producto.getProveedores().clear();
            // Asignar nuevos proveedores
            for (Long proveedorId : proveedorIds) {
                Proveedor proveedor = proveedorRepository.findByIdAndActivoTrue(proveedorId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado con id: " + proveedorId));
                producto.addProveedor(proveedor);
            }
        }
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

    public void actualizarStockYPrecioPorCodigoBarra(String codigoBarra, Float precio, Long stock) {
        Producto producto = productoRepository.findByCodigoBarra(codigoBarra)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado con código de barra: " + codigoBarra));

        if (precio != null && precio >= 0) {
            producto.setPrecio(precio);
        }
        if (stock != null && stock >= 0) {
            producto.setCantidadStock(stock);
        }

        productoRepository.save(producto);
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
        productoDto.setActivo(producto.getActivo());
        productoDto.setProveedorIds(producto.getProveedores().stream()
                .map(Proveedor::getId)
                .collect(Collectors.toList()));
        return productoDto;
    }

}