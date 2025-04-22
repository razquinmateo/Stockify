package tipy.Stockify.services;

import org.springframework.stereotype.Service;
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

    public List<EmpresaDto> getAll() {
        return empresaRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public EmpresaDto getById(Long id) {
        return empresaRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public EmpresaDto create(EmpresaDto empresaDto) {
        Empresa empresa = mapToEntity(empresaDto);
        return mapToDto(empresaRepository.save(empresa));
    }

    public EmpresaDto update(Long id, EmpresaDto empresaDto) {
        if (empresaRepository.existsById(id)) {
            Empresa empresa = mapToEntity(empresaDto);
            empresa.setId(id);
            return mapToDto(empresaRepository.save(empresa));
        }
        return null;
    }

    public void delete(Long id) {
        empresaRepository.deleteById(id);
    }

    public Empresa mapToEntity(EmpresaDto empresaDto) {
        Empresa empresa = new Empresa();
        empresa.setNombre(empresaDto.getNombre());
        empresa.setRut(empresaDto.getRut());
        empresa.setDireccion(empresaDto.getDireccion());
        empresa.setTelefono(empresaDto.getTelefono());
        return empresa;
    }

    public EmpresaDto mapToDto(Empresa empresa) {
        EmpresaDto empresaDto = new EmpresaDto();
        empresaDto.setId(empresa.getId());
        empresaDto.setNombre(empresa.getNombre());
        empresaDto.setRut(empresa.getRut());
        empresaDto.setDireccion(empresa.getDireccion());
        empresaDto.setTelefono(empresa.getTelefono());
        return empresaDto;
    }
}