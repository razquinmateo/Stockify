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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SucursalProveedorService {

    private final SucursalProveedorRepository sucursalProveedorRepository;
    private final SucursalRepository sucursalRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorService proveedorService;

    public SucursalProveedorService(
            SucursalProveedorRepository sucursalProveedorRepository,
            SucursalRepository sucursalRepository,
            ProveedorRepository proveedorRepository,
            ProveedorService proveedorService) {
        this.sucursalProveedorRepository = sucursalProveedorRepository;
        this.sucursalRepository = sucursalRepository;
        this.proveedorRepository = proveedorRepository;
        this.proveedorService = proveedorService;
    }

    public List<SucursalProveedorDto> getAllBySucursalId(Long sucursalId) {
        return sucursalProveedorRepository.findBySucursalIdAndProveedorActivoTrue(sucursalId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public SucursalProveedorDto create(ProveedorDto proveedorDto, Long sucursalId) {
        // Validar y crear el proveedor
        proveedorService.validateProveedorDto(proveedorDto);
        Proveedor proveedor = proveedorService.mapToEntity(proveedorDto);
        proveedor.setActivo(true); // Asegurar que el proveedor sea activo por defecto
        Proveedor savedProveedor = proveedorRepository.save(proveedor);

        // Validar la sucursal
        Sucursal sucursal = sucursalRepository.findByIdAndActivoTrue(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Sucursal no encontrada con id: " + sucursalId));

        // Verificar si la relación ya existe
        if (sucursalProveedorRepository.existsBySucursalIdAndProveedorId(sucursalId, savedProveedor.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La relación Sucursal-Proveedor ya existe");
        }

        // Crear la relación Sucursal-Proveedor
        SucursalProveedor sucursalProveedor = SucursalProveedor.builder()
                .sucursal(sucursal)
                .proveedor(savedProveedor)
                .build();

        return mapToDto(sucursalProveedorRepository.save(sucursalProveedor));
    }

    public ProveedorDto updateProveedor(Long proveedorId, ProveedorDto proveedorDto) {
        return proveedorService.update(proveedorId, proveedorDto);
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
}