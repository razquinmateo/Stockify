package tipy.Stockify.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
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
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public ConteoProductoService(ConteoProductoRepository conteoProductoRepository, ConteoRepository conteoRepository, ProductoRepository productoRepository) {
        this.conteoProductoRepository = conteoProductoRepository;
        this.conteoRepository = conteoRepository;
        this.productoRepository = productoRepository;
    }

    public List<ConteoProductoDto> getAllActive() {
        return conteoProductoRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ConteoProductoDto> getAllIncludingInactive() {
        return conteoProductoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ConteoProductoDto getById(Integer id) {
        return conteoProductoRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ConteoProductoDto create(ConteoProductoDto conteoProductoDto) {
        ConteoProducto conteoProducto = mapToEntity(conteoProductoDto);
        // Asegurar que activo sea true para nuevos conteos de producto, incluso si no se especifica
        conteoProducto.setActivo(true);
        return mapToDto(conteoProductoRepository.save(conteoProducto));
    }

    public ConteoProductoDto update(Integer id, ConteoProductoDto conteoProductoDto) {
        return conteoProductoRepository.findById(id)
                .map(existingConteoProducto -> {
                    updateConteoProductoFields(existingConteoProducto, conteoProductoDto);
                    ConteoProducto updated = conteoProductoRepository.save(existingConteoProducto);
                    // Enviar notificación WebSocket
                    messagingTemplate.convertAndSend(
                            "/topic/conteo-producto-actualizado",
                            mapToDto(updated)
                    );
                    return mapToDto(updated);
                })
                .orElse(null);
    }

    public void deactivate(Integer id) {
        ConteoProducto conteoProducto = conteoProductoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ConteoProducto no encontrado con id: " + id));
        conteoProducto.setActivo(false);
        conteoProductoRepository.save(conteoProducto);
    }

    private void updateConteoProductoFields(ConteoProducto conteoProducto, ConteoProductoDto conteoProductoDto) {
        if (conteoProductoDto.getPrecioActual() != null) {
            conteoProducto.setPrecioActual(conteoProductoDto.getPrecioActual());
        }
        if (conteoProductoDto.getCantidadEsperada() != null) {
            conteoProducto.setCantidadEsperada(conteoProductoDto.getCantidadEsperada());
        }
        if (conteoProductoDto.getCantidadContada() != null) {
            conteoProducto.setCantidadContada(conteoProductoDto.getCantidadContada());
        }
        if (conteoProductoDto.getConteoId() != null) {
            Conteo conteo = conteoRepository.findById(conteoProductoDto.getConteoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteo no encontrado con id: " + conteoProductoDto.getConteoId()));
            conteoProducto.setConteo(conteo);
        }
        if (conteoProductoDto.getProductoId() != null) {
            Producto producto = productoRepository.findById(conteoProductoDto.getProductoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado con id: " + conteoProductoDto.getProductoId()));
            conteoProducto.setProducto(producto);
        }
        if (conteoProductoDto.getActivo() != null) {
            conteoProducto.setActivo(conteoProductoDto.getActivo());
        }
    }

    public ConteoProducto mapToEntity(ConteoProductoDto conteoProductoDto) {
        ConteoProducto conteoProducto = new ConteoProducto();
        conteoProducto.setPrecioActual(conteoProductoDto.getPrecioActual());
        conteoProducto.setCantidadEsperada(conteoProductoDto.getCantidadEsperada());
        conteoProducto.setCantidadContada(conteoProductoDto.getCantidadContada());
        if (conteoProductoDto.getConteoId() != null) {
            Conteo conteo = conteoRepository.findById(conteoProductoDto.getConteoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteo no encontrado con id: " + conteoProductoDto.getConteoId()));
            conteoProducto.setConteo(conteo);
        }
        if (conteoProductoDto.getProductoId() != null) {
            Producto producto = productoRepository.findById(conteoProductoDto.getProductoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado con id: " + conteoProductoDto.getProductoId()));
            conteoProducto.setProducto(producto);
        }
        //activo se establece explícitamente en los métodos create/update
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
        conteoProductoDto.setActivo(conteoProducto.isActivo());
        return conteoProductoDto;
    }
}