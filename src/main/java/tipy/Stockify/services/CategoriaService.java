package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Categoria;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.repositories.CategoriaRepository;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.dtos.CategoriaDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final SucursalRepository sucursalRepository;

    public CategoriaService(CategoriaRepository categoriaRepository, SucursalRepository sucursalRepository) {
        this.categoriaRepository = categoriaRepository;
        this.sucursalRepository = sucursalRepository;
    }

    public List<CategoriaDto> getAll() {
        return categoriaRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CategoriaDto getById(Long id) {
        return categoriaRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public CategoriaDto create(CategoriaDto categoriaDto) {
        Categoria categoria = mapToEntity(categoriaDto);
        return mapToDto(categoriaRepository.save(categoria));
    }

    public CategoriaDto update(Long id, CategoriaDto categoriaDto) {
        if (categoriaRepository.existsById(id)) {
            Categoria categoria = mapToEntity(categoriaDto);
            categoria.setId(id);
            return mapToDto(categoriaRepository.save(categoria));
        }
        return null;
    }

    public void delete(Long id) {
        categoriaRepository.deleteById(id);
    }

    public Categoria mapToEntity(CategoriaDto categoriaDto) {
        Categoria categoria = new Categoria();
        categoria.setNombre(categoriaDto.getNombre());
        categoria.setDescripcion(categoriaDto.getDescripcion());
        if (categoriaDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(categoriaDto.getSucursalId())
                    .orElse(null);
            categoria.setSucursal(sucursal);
        }
        return categoria;
    }

    public CategoriaDto mapToDto(Categoria categoria) {
        CategoriaDto categoriaDto = new CategoriaDto();
        categoriaDto.setId(categoria.getId());
        categoriaDto.setNombre(categoria.getNombre());
        categoriaDto.setDescripcion(categoria.getDescripcion());
        categoriaDto.setSucursalId(categoria.getSucursal() != null ? categoria.getSucursal().getId() : null);
        return categoriaDto;
    }
}