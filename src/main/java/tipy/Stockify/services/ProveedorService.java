package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Proveedor;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.repositories.ProveedorRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.dtos.ProveedorDto;
import tipy.Stockify.utils.ProveedorUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final ProveedorUtils proveedorUtils;

    public ProveedorService(ProveedorRepository proveedorRepository,
                            ProductoRepository productoRepository,
                            ProveedorUtils proveedorUtils) {
        this.proveedorRepository = proveedorRepository;
        this.productoRepository = productoRepository;
        this.proveedorUtils = proveedorUtils;
    }

    public List<ProveedorDto> getAllActive() {
        return proveedorRepository.findByActivoTrue().stream()
                .map(proveedorUtils::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProveedorDto> getAllIncludingInactive() {
        return proveedorRepository.findAll().stream()
                .map(proveedorUtils::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProveedorDto> getAllActiveBySucursalId(Long sucursalId) {
        return proveedorRepository.findByProductosSucursalIdAndActivoTrue(sucursalId).stream()
                .map(proveedorUtils::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProveedorDto> getAllBySucursalId(Long sucursalId) {
        return proveedorRepository.findByProductosSucursalId(sucursalId).stream()
                .map(proveedorUtils::mapToDto)
                .collect(Collectors.toList());
    }

    public ProveedorDto getById(Long id) {
        return proveedorRepository.findByIdAndActivoTrue(id)
                .map(proveedorUtils::mapToDto)
                .orElse(null);
    }

    public ProveedorDto getByNombre(String nombre) {
        return proveedorRepository.findByNombreIgnoreCaseAndActivoTrue(nombre)
                .map(proveedorUtils::mapToDto)
                .orElse(null);
    }

    public ProveedorDto create(ProveedorDto proveedorDto) {
        proveedorUtils.validateProveedorDto(proveedorDto);
        Proveedor proveedor = proveedorUtils.mapToEntity(proveedorDto);
        proveedor.setActivo(true);
        assignProductos(proveedor, proveedorDto.getProductoIds());
        return proveedorUtils.mapToDto(proveedorRepository.save(proveedor));
    }

    public ProveedorDto update(Long id, ProveedorDto proveedorDto) {
        proveedorUtils.validateProveedorDto(proveedorDto);
        return proveedorRepository.findById(id)
                .map(existingProveedor -> {
                    updateProveedorFields(existingProveedor, proveedorDto);
                    assignProductos(existingProveedor, proveedorDto.getProductoIds());
                    return proveedorUtils.mapToDto(proveedorRepository.save(existingProveedor));
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

    private void assignProductos(Proveedor proveedor, List<Long> productoIds) {
        if (productoIds != null) {
            proveedor.getProductos().clear();
            for (Long productoId : productoIds) {
                Producto producto = productoRepository.findByIdAndActivoTrue(productoId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado con id: " + productoId));
                proveedor.getProductos().add(producto);
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
}