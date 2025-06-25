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

    public ProductoDto getByCodigoProducto(String codigoProducto) {
        return productoRepository.findByCodigoProductoAndActivoTrue(codigoProducto)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ProductoDto create(ProductoDto productoDto) {
        validateProductoDto(productoDto);
        validateCodigoProducto(productoDto.getCodigoProducto(), null);
        Producto producto = mapToEntity(productoDto);
        producto.setActivo(true);
        assignProveedores(producto, productoDto.getProveedorIds());
        assignCodigosBarra(producto, productoDto.getCodigosBarra());
        return mapToDto(productoRepository.save(producto));
    }

    public ProductoDto update(Long id, ProductoDto productoDto) {
        validateProductoDto(productoDto);
        validateCodigoProducto(productoDto.getCodigoProducto(), id);
        return productoRepository.findById(id)
                .map(existingProducto -> {
                    updateProductoFields(existingProducto, productoDto);
                    assignProveedores(existingProducto, productoDto.getProveedorIds());
                    assignCodigosBarra(existingProducto, productoDto.getCodigosBarra());
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
        if (productoDto.getCodigosBarra() == null || productoDto.getCodigosBarra().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Al menos un código de barra es requerido");
        }
        if (productoDto.getPrecio() == null || productoDto.getPrecio() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor o igual a 0");
        }
        if (productoDto.getCantidadStock() == null || productoDto.getCantidadStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock debe ser mayor o igual a 0");
        }
        if (productoDto.getCodigoProducto() == null || productoDto.getCodigoProducto().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código del producto es requerido");
        }
    }

    private void validateCodigoProducto(String codigoProducto, Long id) {
        if (codigoProducto != null && !codigoProducto.isEmpty()) {
            Optional<Producto> existingProducto = productoRepository.findByCodigoProducto(codigoProducto);
            if (existingProducto.isPresent() && (id == null || !existingProducto.get().getId().equals(id))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código de producto " + codigoProducto + " ya está asignado a otro producto");
            }
        }
    }

    private void assignProveedores(Producto producto, List<Long> proveedorIds) {
        if (proveedorIds != null) {
            producto.getProveedores().clear();
            for (Long proveedorId : proveedorIds) {
                Proveedor proveedor = proveedorRepository.findByIdAndActivoTrue(proveedorId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado con id: " + proveedorId));
                producto.addProveedor(proveedor);
            }
        }
    }

    private void assignCodigosBarra(Producto producto, List<String> codigosBarra) {
        if (codigosBarra != null) {
            producto.getCodigosBarra().removeIf(cb -> !codigosBarra.contains(cb.getCodigo()));
            for (String codigo : codigosBarra) {
                if (codigo == null || codigo.trim().isEmpty()) {
                    continue;
                }
                Optional<Producto> existingProducto = productoRepository.findByCodigoBarra(codigo);
                if (existingProducto.isPresent() && !existingProducto.get().getId().equals(producto.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "El código de barras " + codigo + " ya está asignado a otro producto");
                }
                boolean existsInProduct = producto.getCodigosBarra().stream()
                        .anyMatch(cb -> cb.getCodigo().equals(codigo));
                if (!existsInProduct) {
                    CodigoBarra codigoBarra = new CodigoBarra();
                    codigoBarra.setCodigo(codigo);
                    producto.addCodigoBarra(codigoBarra);
                }
            }
        }
    }

    private void updateProductoFields(Producto producto, ProductoDto productoDto) {
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
        if (productoDto.getCodigoProducto() != null) {
            producto.setCodigoProducto(productoDto.getCodigoProducto());
        }
    }

    public void actualizarStockYPrecioPorCodigoProductoSiExiste(String codigoProducto, Float precio, Long stock, Long sucursalId,
                                                                List<String> noEncontrados, List<String> actualizados) {
        Optional<Producto> productoOpt = productoRepository.findByCodigoProductoAndSucursalId(codigoProducto, sucursalId);

        if (productoOpt.isEmpty()) {
            noEncontrados.add(codigoProducto);
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
            actualizados.add(codigoProducto);
        }
    }

    public Map<String, Object> crearProductosSimples(List<ProductoDto> productos, Long sucursalIdUsuario) {
        List<String> creados = new ArrayList<>();
        List<String> errores = new ArrayList<>();

        Sucursal sucursalUsuario = sucursalRepository.findById(sucursalIdUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + sucursalIdUsuario));

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

        Categoria sinCategoria = categoriaRepository.findByNombreIgnoreCaseAndSucursal("Sin categoría", sucursalUsuario)
                .orElseGet(() -> {
                    Categoria c = new Categoria();
                    c.setNombre("Sin categoría");
                    c.setDescripcion("Categoría por defecto para productos sin categoría");
                    c.setSucursal(sucursalUsuario);
                    c.setActivo(true);
                    c.setCodigoCategoria("DEFAULT");
                    return categoriaRepository.save(c);
                });

        for (ProductoDto dto : productos) {
            // Validar campos requeridos
            if (dto.getNombre() == null || dto.getNombre().isEmpty() ||
                    dto.getCodigosBarra() == null || dto.getCodigosBarra().isEmpty() ||
                    dto.getPrecio() == null || dto.getPrecio() < 0 ||
                    dto.getCantidadStock() == null || dto.getCantidadStock() < 0) {
                errores.add(dto.getCodigoProducto() != null ? dto.getCodigoProducto() : "Producto sin código - Datos faltantes o inválidos");
                continue;
            }

            try {
                // Validar que los códigos de barra no estén asignados a otro producto
                for (String codigoBarra : dto.getCodigosBarra()) {
                    if (codigoBarra == null || codigoBarra.trim().isEmpty()) {
                        errores.add(dto.getCodigoProducto() + " - Código de barras inválido");
                        continue;
                    }
                    Optional<Producto> existingProducto = productoRepository.findByCodigoBarra(codigoBarra);
                    if (existingProducto.isPresent()) {
                        errores.add(dto.getCodigoProducto() + " - Código de barras " + codigoBarra + " ya está asignado a otro producto");
                        continue;
                    }
                }

                // Validar código de producto único
                String codigoProducto = dto.getCodigoProducto();
                if (codigoProducto == null || codigoProducto.trim().isEmpty()) {
                    errores.add("Código de producto es obligatorio");
                    continue;
                }

                if (productoRepository.findByCodigoProducto(codigoProducto).isPresent()) {
                    errores.add(codigoProducto + " - Código de producto ya está asignado");
                    continue;
                }

                // Determinar categoría
                Categoria categoria = sinCategoria;
                if (dto.getCategoriaId() != null) {
                    categoria = categoriaRepository.findById(dto.getCategoriaId())
                            .filter(cat -> cat.isActivo() && cat.getSucursal().getId().equals(sucursalIdUsuario))
                            .orElseGet(() -> {
                                errores.add(codigoProducto + " - Categoría con ID " + dto.getCategoriaId() + " no encontrada o no pertenece a la sucursal");
                                return sinCategoria;
                            });
                }

                // Crear el producto
                Producto producto = new Producto();
                producto.setNombre(dto.getNombre());
                producto.setCodigoProducto(codigoProducto);
                producto.setPrecio(dto.getPrecio());
                producto.setCantidadStock(dto.getCantidadStock());
                producto.setImagen(dto.getImagen());
                producto.setDetalle(dto.getDetalle());
                producto.setActivo(true);
                producto.setCategoria(categoria);
                producto.setSucursal(sucursalUsuario);

                // Asignar códigos de barra
                assignCodigosBarra(producto, dto.getCodigosBarra());

                productoRepository.save(producto);
                creados.add(producto.getCodigoProducto());
            } catch (Exception e) {
                errores.add(dto.getCodigoProducto() != null ? dto.getCodigoProducto() : "Producto sin código - " + e.getMessage());
            }
        }

        return Map.of(
                "mensaje", "Carga finalizada",
                "creados", creados,
                "errores", errores
        );
    }

    public Producto mapToEntity(ProductoDto productoDto) {
        Producto producto = new Producto();
        producto.setCodigoProducto(productoDto.getCodigoProducto());
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
        } else {
            // Fallback to "Sin categoría" if no categoriaId is provided
            Sucursal sucursal = sucursalRepository.findById(productoDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + productoDto.getSucursalId()));
            Categoria sinCategoria = categoriaRepository.findByNombreIgnoreCaseAndSucursal("Sin categoría", sucursal)
                    .orElseGet(() -> {
                        Categoria c = new Categoria();
                        c.setNombre("Sin categoría");
                        c.setDescripcion("Categoría por defecto para productos sin categoría");
                        c.setSucursal(sucursal);
                        c.setActivo(true);
                        c.setCodigoCategoria("DEFAULT");
                        return categoriaRepository.save(c);
                    });
            producto.setCategoria(sinCategoria);
        }
        return producto;
    }

    public ProductoDto mapToDto(Producto producto) {
        ProductoDto productoDto = new ProductoDto();
        productoDto.setId(producto.getId());
        productoDto.setCodigoProducto(producto.getCodigoProducto());
        productoDto.setCodigosBarra(producto.getCodigosBarra().stream()
                .map(CodigoBarra::getCodigo)
                .collect(Collectors.toList()));
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