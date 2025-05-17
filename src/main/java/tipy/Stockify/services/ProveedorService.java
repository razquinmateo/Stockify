package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Proveedor;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.repositories.ProveedorRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.dtos.ProveedorDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;

    public ProveedorService(ProveedorRepository proveedorRepository, ProductoRepository productoRepository) {
        this.proveedorRepository = proveedorRepository;
        this.productoRepository = productoRepository;
    }

    public List<ProveedorDto> getAllActive() {
        return proveedorRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProveedorDto> getAllIncludingInactive() {
        return proveedorRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProveedorDto> getAllActiveBySucursalId(Long sucursalId) {
        return proveedorRepository.findByProductosSucursalIdAndActivoTrue(sucursalId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProveedorDto getById(Long id) {
        return proveedorRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ProveedorDto create(ProveedorDto proveedorDto) {
        validateProveedorDto(proveedorDto);
        Proveedor proveedor = mapToEntity(proveedorDto);
        proveedor.setActivo(true);
        assignProductos(proveedor, proveedorDto.getProductoIds());
        return mapToDto(proveedorRepository.save(proveedor));
    }

    public ProveedorDto update(Long id, ProveedorDto proveedorDto) {
        validateProveedorDto(proveedorDto);
        return proveedorRepository.findById(id)
                .map(existingProveedor -> {
                    updateProveedorFields(existingProveedor, proveedorDto);
                    assignProductos(existingProveedor, proveedorDto.getProductoIds());
                    return mapToDto(proveedorRepository.save(existingProveedor));
                })
                .orElse(null);
    }

    public void toggleActive(Long id, Boolean activo) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado con id: " + id));
        proveedor.setActivo(activo);
        proveedorRepository.save(proveedor);
    }

    public void deactivate(Long id) {
        toggleActive(id, false);
    }

    public void validateProveedorDto(ProveedorDto proveedorDto) {
        if (proveedorDto.getRut() == null || proveedorDto.getRut().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El RUT del proveedor es requerido");
        }
        if (proveedorDto.getNombre() == null || proveedorDto.getNombre().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del proveedor es requerido");
        }
    }

    private void assignProductos(Proveedor proveedor, List<Long> productoIds) {
        if (productoIds != null) {
            // Clear existing products
            proveedor.getProductos().clear();
            // Assign new products
            for (Long productoId : productoIds) {
                Producto producto = productoRepository.findByIdAndActivoTrue(productoId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado con id: " + productoId));
                proveedor.getProductos().add(producto);
                // Ensure bidirectional relationship
                producto.getProveedores().add(proveedor);
            }
        }
    }

    private void updateProveedorFields(Proveedor proveedor, ProveedorDto proveedorDto) {
        if (proveedorDto.getRut() != null) {
            proveedor.setRut(proveedorDto.getRut());
        }
        if (proveedorDto.getNombre() != null) {
            proveedor.setNombre(proveedorDto.getNombre());
        }
        if (proveedorDto.getDireccion() != null) {
            proveedor.setDireccion(proveedorDto.getDireccion());
        }
        if (proveedorDto.getTelefono() != null) {
            proveedor.setTelefono(proveedorDto.getTelefono());
        }
        if (proveedorDto.getNombreVendedor() != null) {
            proveedor.setNombreVendedor(proveedorDto.getNombreVendedor());
        }
        if (proveedorDto.getActivo() != null) {
            proveedor.setActivo(proveedorDto.getActivo());
        }
    }

    public Proveedor mapToEntity(ProveedorDto proveedorDto) {
        Proveedor proveedor = new Proveedor();
        proveedor.setRut(proveedorDto.getRut());
        proveedor.setNombre(proveedorDto.getNombre());
        proveedor.setDireccion(proveedorDto.getDireccion());
        proveedor.setTelefono(proveedorDto.getTelefono());
        proveedor.setNombreVendedor(proveedorDto.getNombreVendedor());
        return proveedor;
    }

    public ProveedorDto mapToDto(Proveedor proveedor) {
        ProveedorDto proveedorDto = new ProveedorDto();
        proveedorDto.setId(proveedor.getId());
        proveedorDto.setRut(proveedor.getRut());
        proveedorDto.setNombre(proveedor.getNombre());
        proveedorDto.setDireccion(proveedor.getDireccion());
        proveedorDto.setTelefono(proveedor.getTelefono());
        proveedorDto.setNombreVendedor(proveedor.getNombreVendedor());
        proveedorDto.setActivo(proveedor.getActivo());
        proveedorDto.setProductoIds(proveedor.getProductos().stream()
                .map(Producto::getId)
                .collect(Collectors.toList()));
        return proveedorDto;
    }
}