package tipy.Stockify.services;

import org.springframework.stereotype.Service;
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

    public List<SucursalDto> getAll() {
        return sucursalRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public SucursalDto getById(Long id) {
        return sucursalRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public SucursalDto create(SucursalDto sucursalDto) {
        Sucursal sucursal = mapToEntity(sucursalDto);
        return mapToDto(sucursalRepository.save(sucursal));
    }

    public SucursalDto update(Long id, SucursalDto sucursalDto) {
        if (sucursalRepository.existsById(id)) {
            Sucursal sucursal = mapToEntity(sucursalDto);
            sucursal.setId(id);
            return mapToDto(sucursalRepository.save(sucursal));
        }
        return null;
    }

    public void delete(Long id) {
        sucursalRepository.deleteById(id);
    }

    public Sucursal mapToEntity(SucursalDto sucursalDto) {
        Sucursal sucursal = new Sucursal();
        sucursal.setNombre(sucursalDto.getNombre());
        sucursal.setDireccion(sucursalDto.getDireccion());
        sucursal.setTelefono(sucursalDto.getTelefono());
        if (sucursalDto.getEmpresaId() != null) {
            Empresa empresa = empresaRepository.findById(sucursalDto.getEmpresaId())
                    .orElse(null);
            sucursal.setEmpresa(empresa);
        }
        return sucursal;
    }

    public SucursalDto mapToDto(Sucursal sucursal) {
        SucursalDto sucursalDto = new SucursalDto();
        sucursalDto.setId(sucursal.getId());
        sucursalDto.setNombre(sucursal.getNombre());
        sucursalDto.setDireccion(sucursal.getDireccion());
        sucursalDto.setTelefono(sucursal.getTelefono());
        sucursalDto.setEmpresaId(sucursal.getEmpresa() != null ? sucursal.getEmpresa().getId() : null);
        return sucursalDto;
    }
}