package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Empresa;
import tipy.Stockify.business.repositories.EmpresaRepository;
import tipy.Stockify.dtos.EmpresaDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    public EmpresaService(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    public List<EmpresaDto> getAllActive() {
        return empresaRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<EmpresaDto> getAllIncludingInactive() {
        return empresaRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public EmpresaDto getById(Long id) {
        return empresaRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public EmpresaDto create(EmpresaDto empresaDto) {
        Empresa empresa = mapToEntity(empresaDto);
        // Asegurar que activo sea true para nuevas empresas, incluso si no se especifica
        empresa.setActivo(true);
        return mapToDto(empresaRepository.save(empresa));
    }

    public EmpresaDto update(Long id, EmpresaDto empresaDto) {
        return empresaRepository.findById(id)
                .map(existingEmpresa -> {
                    updateEmpresaFields(existingEmpresa, empresaDto);
                    return mapToDto(empresaRepository.save(existingEmpresa));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada con id: " + id));
        empresa.setActivo(false);
        empresaRepository.save(empresa);
    }

    private void updateEmpresaFields(Empresa empresa, EmpresaDto empresaDto) {
        if (empresaDto.getNombre() != null) {
            empresa.setNombre(empresaDto.getNombre());
        }
        if (empresaDto.getRut() != null) {
            empresa.setRut(empresaDto.getRut());
        }
        if (empresaDto.getDireccion() != null) {
            empresa.setDireccion(empresaDto.getDireccion());
        }
        if (empresaDto.getTelefono() != null) {
            empresa.setTelefono(empresaDto.getTelefono());
        }
        if (empresaDto.getActivo() != null) {
            empresa.setActivo(empresaDto.getActivo());
        }
    }

    public Empresa mapToEntity(EmpresaDto empresaDto) {
        Empresa empresa = new Empresa();
        empresa.setNombre(empresaDto.getNombre());
        empresa.setRut(empresaDto.getRut());
        empresa.setDireccion(empresaDto.getDireccion());
        empresa.setTelefono(empresaDto.getTelefono());
        //activo se establece explícitamente en los métodos create/update
        return empresa;
    }

    public EmpresaDto mapToDto(Empresa empresa) {
        EmpresaDto empresaDto = new EmpresaDto();
        empresaDto.setId(empresa.getId());
        empresaDto.setNombre(empresa.getNombre());
        empresaDto.setRut(empresa.getRut());
        empresaDto.setDireccion(empresa.getDireccion());
        empresaDto.setTelefono(empresa.getTelefono());
        empresaDto.setActivo(empresa.isActivo());
        return empresaDto;
    }
}