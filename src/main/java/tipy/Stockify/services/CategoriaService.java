package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
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

    public List<CategoriaDto> getAllActive() {
        return categoriaRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<CategoriaDto> getAllIncludingInactive() {
        return categoriaRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CategoriaDto getById(Long id) {
        return categoriaRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public CategoriaDto create(CategoriaDto categoriaDto) {
        Categoria categoria = mapToEntity(categoriaDto);
        // Asegurar que activo sea true para nuevas categorías, incluso si no se especifica
        categoria.setActivo(true);
        return mapToDto(categoriaRepository.save(categoria));
    }

    public CategoriaDto update(Long id, CategoriaDto categoriaDto) {
        return categoriaRepository.findById(id)
                .map(existingCategoria -> {
                    updateCategoriaFields(existingCategoria, categoriaDto);
                    return mapToDto(categoriaRepository.save(existingCategoria));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada con id: " + id));
        categoria.setActivo(false);
        categoriaRepository.save(categoria);
    }

    private void updateCategoriaFields(Categoria categoria, CategoriaDto categoriaDto) {
        if (categoriaDto.getNombre() != null) {
            categoria.setNombre(categoriaDto.getNombre());
        }
        if (categoriaDto.getDescripcion() != null) {
            categoria.setDescripcion(categoriaDto.getDescripcion());
        }
        if (categoriaDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(categoriaDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + categoriaDto.getSucursalId()));
            categoria.setSucursal(sucursal);
        }
        if (categoriaDto.getActivo() != null) {
            categoria.setActivo(categoriaDto.getActivo());
        }
    }

    public Categoria mapToEntity(CategoriaDto categoriaDto) {
        Categoria categoria = new Categoria();
        categoria.setNombre(categoriaDto.getNombre());
        categoria.setDescripcion(categoriaDto.getDescripcion());
        if (categoriaDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(categoriaDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + categoriaDto.getSucursalId()));
            categoria.setSucursal(sucursal);
        }
        //activo se establece explícitamente en los métodos create/update
        return categoria;
    }

    public CategoriaDto mapToDto(Categoria categoria) {
        CategoriaDto categoriaDto = new CategoriaDto();
        categoriaDto.setId(categoria.getId());
        categoriaDto.setNombre(categoria.getNombre());
        categoriaDto.setDescripcion(categoria.getDescripcion());
        categoriaDto.setSucursalId(categoria.getSucursal() != null ? categoria.getSucursal().getId() : null);
        categoriaDto.setActivo(categoria.isActivo());
        return categoriaDto;
    }
}