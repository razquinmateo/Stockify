package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.*;
import tipy.Stockify.business.repositories.*;
import tipy.Stockify.dtos.ProductoDto;

import java.util.*;

import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final SucursalRepository sucursalRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final EmpresaRepository empresaRepository;

    public ProductoService(
            ProductoRepository productoRepository,
            SucursalRepository sucursalRepository,
            CategoriaRepository categoriaRepository,
            ProveedorRepository proveedorRepository,
            EmpresaRepository empresaRepository) {
        this.productoRepository = productoRepository;
        this.sucursalRepository = sucursalRepository;
        this.categoriaRepository = categoriaRepository;
        this.proveedorRepository = proveedorRepository;
        this.empresaRepository = empresaRepository;
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

    public void actualizarStockYPrecioPorCodigoBarraSiExiste(String codigoBarra, Float precio, Long stock, Long sucursalId,
                                                             List<String> noEncontrados, List<String> actualizados) {
        Optional<Producto> productoOpt = productoRepository.findByCodigoBarraAndSucursalId(codigoBarra, sucursalId);

        if (productoOpt.isEmpty()) {
            noEncontrados.add(codigoBarra);
            return;
        }

        Producto producto = productoOpt.get();

        boolean seActualizo = false;

        if (precio != null && precio >= 0) {
            producto.setPrecio(precio);
            seActualizo = true;
        }

        if (stock != null && stock >= 0) {
            producto.setCantidadStock(stock);
            seActualizo = true;
        }

        if (seActualizo) {
            productoRepository.save(producto);
            actualizados.add(codigoBarra);
        }
    }

    public Map<String, Object> crearProductosSimples(List<ProductoDto> productos, Long sucursalIdUsuario) {
        List<String> creados = new ArrayList<>();
        List<String> errores = new ArrayList<>();

        Sucursal sucursalUsuario = sucursalRepository.findById(sucursalIdUsuario)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        Empresa sinEmpresa = empresaRepository.findByNombreIgnoreCase("Sin empresa")
                .orElseGet(() -> {
                    Empresa e = new Empresa();
                    e.setNombre("Sin empresa");
                    e.setRut("N/D");
                    e.setDireccion("N/D");
                    e.setTelefono("N/D");
                    e.setActivo(true);
                    return empresaRepository.save(e);
                });

        // Buscar o crear sucursal "Sin sucursal"
        Sucursal sinSucursal = sucursalRepository.findByNombreIgnoreCase("Sin sucursal")
                .orElseGet(() -> {
                    Sucursal s = new Sucursal();
                    s.setNombre("Sin sucursal");
                    s.setDireccion("N/D");
                    s.setTelefono("N/D");
                    s.setActivo(true);
                    s.setEmpresa(sinEmpresa);
                    return sucursalRepository.save(s);
                });

        // Buscar o crear categoría "Sin categoría"
        Categoria sinCategoria = categoriaRepository.findByNombreIgnoreCaseAndSucursal("Sin categoría", sucursalUsuario)
                .orElseGet(() -> {
                    Categoria c = new Categoria();
                    c.setNombre("Sin categoría");
                    c.setDescripcion("Categoría por defecto para productos sin categoría");
                    c.setSucursal(sucursalUsuario);
                    c.setActivo(true);
                    return categoriaRepository.save(c);
                });


        for (ProductoDto dto : productos) {
            if (dto.getNombre() == null || dto.getCodigoBarra() == null
                    || dto.getPrecio() == null || dto.getCantidadStock() == null) {
                errores.add(dto.getCodigoBarra() + " - Datos faltantes");
                continue;
            }

            try {
                Producto producto = new Producto();
                producto.setNombre(dto.getNombre());
                producto.setCodigoBarra(dto.getCodigoBarra());
                producto.setPrecio(dto.getPrecio());
                producto.setCantidadStock(dto.getCantidadStock());
                producto.setImagen(dto.getImagen());
                producto.setDetalle(dto.getDetalle());
                producto.setActivo(true);

                // Asignar categoría y sucursal por defecto
                producto.setCategoria(sinCategoria);
                producto.setSucursal(sucursalUsuario);

                productoRepository.save(producto);
                creados.add(dto.getCodigoBarra());
            } catch (Exception e) {
                errores.add(dto.getCodigoBarra() + " - " + e.getMessage());
            }
        }

        return Map.of(
                "mensaje", "Carga finalizada",
                "creados", creados,
                "errores", errores
        );
    }

}