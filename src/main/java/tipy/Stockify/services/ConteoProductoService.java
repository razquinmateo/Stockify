package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Conteo;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.entities.ConteoProducto;
import tipy.Stockify.business.repositories.ConteoRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.business.repositories.ConteoProductoRepository;
import tipy.Stockify.dtos.ConteoProductoDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConteoProductoService {

    private final ConteoProductoRepository conteoProductoRepository;
    private final ConteoRepository conteoRepository;
    private final ProductoRepository productoRepository;

    public ConteoProductoService(ConteoProductoRepository conteoProductoRepository, ConteoRepository conteoRepository, ProductoRepository productoRepository) {
        this.conteoProductoRepository = conteoProductoRepository;
        this.conteoRepository = conteoRepository;
        this.productoRepository = productoRepository;
    }

    public List<ConteoProductoDto> getAll() {
        return conteoProductoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ConteoProductoDto getById(Integer id) {
        return conteoProductoRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ConteoProductoDto create(ConteoProductoDto conteoProductoDto) {
        ConteoProducto conteoProducto = mapToEntity(conteoProductoDto);
        return mapToDto(conteoProductoRepository.save(conteoProducto));
    }

    public ConteoProductoDto update(Integer id, ConteoProductoDto conteoProductoDto) {
        if (conteoProductoRepository.existsById(id)) {
            ConteoProducto conteoProducto = mapToEntity(conteoProductoDto);
            conteoProducto.setId(id);
            return mapToDto(conteoProductoRepository.save(conteoProducto));
        }
        return null;
    }

    public void delete(Integer id) {
        conteoProductoRepository.deleteById(id);
    }

    public ConteoProducto mapToEntity(ConteoProductoDto conteoProductoDto) {
        ConteoProducto conteoProducto = new ConteoProducto();
        conteoProducto.setPrecioActual(conteoProductoDto.getPrecioActual());
        conteoProducto.setCantidadEsperada(conteoProductoDto.getCantidadEsperada());
        conteoProducto.setCantidadContada(conteoProductoDto.getCantidadContada());
        if (conteoProductoDto.getConteoId() != null) {
            Conteo conteo = conteoRepository.findById(conteoProductoDto.getConteoId())
                    .orElse(null);
            conteoProducto.setConteo(conteo);
        }
        if (conteoProductoDto.getProductoId() != null) {
            Producto producto = productoRepository.findById(conteoProductoDto.getProductoId())
                    .orElse(null);
            conteoProducto.setProducto(producto);
        }
        return conteoProducto;
    }

    public ConteoProductoDto mapToDto(ConteoProducto conteoProducto) {
        ConteoProductoDto conteoProductoDto = new ConteoProductoDto();
        conteoProductoDto.setId(conteoProducto.getId());
        conteoProductoDto.setPrecioActual(conteoProducto.getPrecioActual());
        conteoProductoDto.setCantidadEsperada(conteoProducto.getCantidadEsperada());
        conteoProductoDto.setCantidadContada(conteoProducto.getCantidadContada());
        conteoProductoDto.setConteoId(conteoProducto.getConteo() != null ? conteoProducto.getConteo().getId() : null);
        conteoProductoDto.setProductoId(conteoProducto.getProducto() != null ? conteoProducto.getProducto().getId() : null);
        return conteoProductoDto;
    }
}