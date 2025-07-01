package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Empresa;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.repositories.EmpresaRepository;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.dtos.SucursalDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;
    private final EmpresaRepository empresaRepository;

    public SucursalService(SucursalRepository sucursalRepository, EmpresaRepository empresaRepository) {
        this.sucursalRepository = sucursalRepository;
        this.empresaRepository = empresaRepository;
    }

    public List<SucursalDto> getAllActive() {
        return sucursalRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<SucursalDto> getAllIncludingInactive() {
        return sucursalRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public SucursalDto getById(Long id) {
        return sucursalRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public SucursalDto create(SucursalDto sucursalDto) {
        Sucursal sucursal = mapToEntity(sucursalDto);
        // aseguramos que activo sea true para nuevas sucursales
        sucursal.setActivo(true);
        return mapToDto(sucursalRepository.save(sucursal));
    }

    public SucursalDto update(Long id, SucursalDto sucursalDto) {
        return sucursalRepository.findById(id)
                .map(existingSucursal -> {
                    updateSucursalFields(existingSucursal, sucursalDto);
                    return mapToDto(sucursalRepository.save(existingSucursal));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Sucursal sucursal = sucursalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + id));
        sucursal.setActivo(false);
        sucursalRepository.save(sucursal);
    }

    private void updateSucursalFields(Sucursal sucursal, SucursalDto sucursalDto) {
        if (sucursalDto.getNombre() != null) {
            sucursal.setNombre(sucursalDto.getNombre());
        }
        if (sucursalDto.getDireccion() != null) {
            sucursal.setDireccion(sucursalDto.getDireccion());
        }
        if (sucursalDto.getTelefono() != null) {
            sucursal.setTelefono(sucursalDto.getTelefono());
        }
        if (sucursalDto.getEmpresaId() != null) {
            Empresa empresa = empresaRepository.findById(sucursalDto.getEmpresaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada con id: " + sucursalDto.getEmpresaId()));
            sucursal.setEmpresa(empresa);
        }
        if (sucursalDto.getActivo() != null) {
            sucursal.setActivo(sucursalDto.getActivo());
        }
    }

    public Sucursal mapToEntity(SucursalDto sucursalDto) {
        Sucursal sucursal = new Sucursal();
        sucursal.setNombre(sucursalDto.getNombre());
        sucursal.setDireccion(sucursalDto.getDireccion());
        sucursal.setTelefono(sucursalDto.getTelefono());
        if (sucursalDto.getEmpresaId() != null) {
            Empresa empresa = empresaRepository.findById(sucursalDto.getEmpresaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada con id: " + sucursalDto.getEmpresaId()));
            sucursal.setEmpresa(empresa);
        }
        //activo se establece explícitamente en los métodos create/update
        return sucursal;
    }

    public SucursalDto mapToDto(Sucursal sucursal) {
        SucursalDto sucursalDto = new SucursalDto();
        sucursalDto.setId(sucursal.getId());
        sucursalDto.setNombre(sucursal.getNombre());
        sucursalDto.setDireccion(sucursal.getDireccion());
        sucursalDto.setTelefono(sucursal.getTelefono());
        sucursalDto.setEmpresaId(sucursal.getEmpresa() != null ? sucursal.getEmpresa().getId() : null);
        sucursalDto.setActivo(sucursal.isActivo());
        return sucursalDto;
    }
}