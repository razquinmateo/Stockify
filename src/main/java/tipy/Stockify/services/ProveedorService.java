package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Proveedor;
import tipy.Stockify.business.repositories.ProveedorRepository;
import tipy.Stockify.dtos.ProveedorDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    public List<ProveedorDto> getAll() {
        return proveedorRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProveedorDto getById(Long id) {
        return proveedorRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ProveedorDto create(ProveedorDto proveedorDto) {
        Proveedor proveedor = mapToEntity(proveedorDto);
        return mapToDto(proveedorRepository.save(proveedor));
    }

    public ProveedorDto update(Long id, ProveedorDto proveedorDto) {
        if (proveedorRepository.existsById(id)) {
            Proveedor proveedor = mapToEntity(proveedorDto);
            proveedor.setId(id);
            return mapToDto(proveedorRepository.save(proveedor));
        }
        return null;
    }

    public void delete(Long id) {
        proveedorRepository.deleteById(id);
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
        return proveedorDto;
    }
}