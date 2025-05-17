package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Proveedor;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.entities.SucursalProveedor;
import tipy.Stockify.business.repositories.ProveedorRepository;
import tipy.Stockify.business.repositories.SucursalProveedorRepository;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.dtos.ProveedorDto;
import tipy.Stockify.dtos.SucursalProveedorDto;
import tipy.Stockify.utils.ProveedorUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SucursalProveedorService {

    private final SucursalProveedorRepository sucursalProveedorRepository;
    private final SucursalRepository sucursalRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorUtils proveedorUtils;

    public SucursalProveedorService(
            SucursalProveedorRepository sucursalProveedorRepository,
            SucursalRepository sucursalRepository,
            ProveedorRepository proveedorRepository,
            ProveedorUtils proveedorUtils) {
        this.sucursalProveedorRepository = sucursalProveedorRepository;
        this.sucursalRepository = sucursalRepository;
        this.proveedorRepository = proveedorRepository;
        this.proveedorUtils = proveedorUtils;
    }

    public List<SucursalProveedorDto> getAllBySucursalId(Long sucursalId) {
        return sucursalProveedorRepository.findBySucursalIdAndProveedorActivoTrue(sucursalId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public SucursalProveedorDto create(ProveedorDto proveedorDto, Long sucursalId) {
        proveedorUtils.validateProveedorDto(proveedorDto);
        Proveedor proveedor = proveedorUtils.mapToEntity(proveedorDto);
        proveedor.setActivo(true);
        Proveedor savedProveedor = proveedorRepository.save(proveedor);

        Sucursal sucursal = sucursalRepository.findByIdAndActivoTrue(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Sucursal no encontrada con id: " + sucursalId));

        if (sucursalProveedorRepository.existsBySucursalIdAndProveedorId(sucursalId, savedProveedor.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La relación Sucursal-Proveedor ya existe");
        }

        SucursalProveedor sucursalProveedor = SucursalProveedor.builder()
                .sucursal(sucursal)
                .proveedor(savedProveedor)
                .build();

        return mapToDto(sucursalProveedorRepository.save(sucursalProveedor));
    }

    public ProveedorDto updateProveedor(Long proveedorId, ProveedorDto proveedorDto) {
        proveedorUtils.validateProveedorDto(proveedorDto);
        return proveedorRepository.findById(proveedorId)
                .map(existingProveedor -> {
                    updateProveedorFields(existingProveedor, proveedorDto);
                    return proveedorUtils.mapToDto(proveedorRepository.save(existingProveedor));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Proveedor no encontrado con id: " + proveedorId));
    }

    public SucursalProveedorDto linkSucursalProveedor(Long sucursalId, Long proveedorId) {
        Sucursal sucursal = sucursalRepository.findByIdAndActivoTrue(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Sucursal no encontrada con id: " + sucursalId));

        Proveedor proveedor = proveedorRepository.findByIdAndActivoTrue(proveedorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Proveedor no encontrado con id: " + proveedorId));

        if (sucursalProveedorRepository.existsBySucursalIdAndProveedorId(sucursalId, proveedorId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La relación Sucursal-Proveedor ya existe");
        }

        SucursalProveedor sucursalProveedor = SucursalProveedor.builder()
                .sucursal(sucursal)
                .proveedor(proveedor)
                .build();

        return mapToDto(sucursalProveedorRepository.save(sucursalProveedor));
    }

    public void toggleProveedorActivo(Long proveedorId, boolean activo) {
        Proveedor proveedor = proveedorRepository.findById(proveedorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Proveedor no encontrado con id: " + proveedorId));
        proveedor.setActivo(activo);
        proveedorRepository.save(proveedor);
    }

    private void validateSucursalProveedorDto(SucursalProveedorDto sucursalProveedorDto) {
        if (sucursalProveedorDto.getSucursalId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ID de la sucursal es requerido");
        }
        if (sucursalProveedorDto.getProveedorId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ID del proveedor es requerido");
        }
    }

    private SucursalProveedorDto mapToDto(SucursalProveedor sucursalProveedor) {
        SucursalProveedorDto dto = new SucursalProveedorDto();
        dto.setId(sucursalProveedor.getId());
        dto.setSucursalId(sucursalProveedor.getSucursal().getId());
        dto.setProveedorId(sucursalProveedor.getProveedor().getId());
        dto.setProveedorNombre(sucursalProveedor.getProveedor().getNombre());
        dto.setProveedorRut(sucursalProveedor.getProveedor().getRut());
        dto.setProveedorTelefono(sucursalProveedor.getProveedor().getTelefono());
        dto.setProveedorDireccion(sucursalProveedor.getProveedor().getDireccion());
        dto.setProveedorNombreVendedor(sucursalProveedor.getProveedor().getNombreVendedor());
        dto.setProveedorActivo(sucursalProveedor.getProveedor().getActivo());
        return dto;
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