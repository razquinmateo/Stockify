package tipy.Stockify.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Lote;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.repositories.LoteRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.dtos.LoteDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoteService {

    private static final Logger logger = LoggerFactory.getLogger(LoteService.class);
    private final LoteRepository loteRepository;
    private final ProductoRepository productoRepository;

    public LoteService(LoteRepository loteRepository, ProductoRepository productoRepository) {
        this.loteRepository = loteRepository;
        this.productoRepository = productoRepository;
    }

    public List<LoteDto> getAllActive() {
        logger.info("Obteniendo todos los lotes activos");
        return loteRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LoteDto> getAllIncludingInactive() {
        logger.info("Obteniendo todos los lotes, incluidos inactivos");
        return loteRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LoteDto> getAllBySucursal(Long sucursalId) {
        logger.info("Obteniendo lotes para sucursalId: {}", sucursalId);
        return loteRepository.findByProducto_Sucursal_Id(sucursalId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LoteDto> getAllActiveBySucursal(Long sucursalId) {
        logger.info("Obteniendo lotes activos para sucursalId: {}", sucursalId);
        return loteRepository.findByProducto_Sucursal_IdAndActivoTrue(sucursalId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LoteDto getById(Long id) {
        logger.info("Obteniendo lote con id: {}", id);
        return loteRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional
    public LoteDto create(LoteDto loteDto) {
        logger.info("Creando lote: {}", loteDto.getNumeroLote());
        validateLoteDto(loteDto);
        Lote lote = mapToEntity(loteDto);
        lote.setActivo(true);

        // Actualizar el stock del producto
        Producto producto = lote.getProducto();
        producto.setCantidadStock(producto.getCantidadStock() + lote.getCantidadStock());
        if (producto.getCantidadStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock del producto no puede ser negativo");
        }
        productoRepository.save(producto);

        Lote savedLote = loteRepository.save(lote);
        return mapToDto(savedLote);
    }

    @Transactional
    public LoteDto update(Long id, LoteDto loteDto) {
        logger.info("Actualizando lote con id: {}", id);
        validateLoteDto(loteDto);
        return loteRepository.findById(id)
                .map(existingLote -> {
                    // Calcular la diferencia en cantidadStock
                    int oldCantidadStock = existingLote.getCantidadStock();
                    int newCantidadStock = loteDto.getCantidadStock() != null ? loteDto.getCantidadStock() : oldCantidadStock;
                    int stockDifference = newCantidadStock - oldCantidadStock;

                    // Actualizar el stock del producto
                    Producto producto = existingLote.getProducto();
                    producto.setCantidadStock(producto.getCantidadStock() + stockDifference);
                    if (producto.getCantidadStock() < 0) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock del producto no puede ser negativo");
                    }
                    productoRepository.save(producto);

                    updateLoteFields(existingLote, loteDto);
                    return mapToDto(loteRepository.save(existingLote));
                })
                .orElse(null);
    }

    @Transactional
    public void deactivate(Long id) {
        logger.info("Desactivando lote con id: {}", id);
        Lote lote = loteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lote no encontrado con id: " + id));
        if (!lote.getActivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El lote ya está inactivo");
        }

        // Restar el cantidadStock del producto
        Producto producto = lote.getProducto();
        producto.setCantidadStock(producto.getCantidadStock() - lote.getCantidadStock());
        if (producto.getCantidadStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock del producto no puede ser negativo al desactivar el lote");
        }
        productoRepository.save(producto);

        lote.setActivo(false);
        loteRepository.save(lote);
    }

    private void validateLoteDto(LoteDto loteDto) {
        if (loteDto.getNumeroLote() == null || loteDto.getNumeroLote().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de lote es requerido");
        }
        if (loteDto.getFechaIngreso() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de ingreso es requerida");
        }
        if (loteDto.getCantidadStock() == null || loteDto.getCantidadStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad de stock debe ser mayor o igual a 0");
        }
        if (loteDto.getProductoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un producto");
        }
        Producto producto = productoRepository.findById(loteDto.getProductoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no encontrado con id: " + loteDto.getProductoId()));
        if (!producto.getActivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto con id " + loteDto.getProductoId() + " no está activo");
        }
    }

    private void updateLoteFields(Lote lote, LoteDto loteDto) {
        if (loteDto.getNumeroLote() != null) {
            lote.setNumeroLote(loteDto.getNumeroLote());
        }
        if (loteDto.getFechaIngreso() != null) {
            lote.setFechaIngreso(loteDto.getFechaIngreso());
        }
        lote.setFechaVencimiento(loteDto.getFechaVencimiento()); // Puede ser null
        if (loteDto.getCantidadStock() != null) {
            lote.setCantidadStock(loteDto.getCantidadStock());
        }
        if (loteDto.getActivo() != null) {
            lote.setActivo(loteDto.getActivo());
        }
        if (loteDto.getProductoId() != null) {
            Producto producto = productoRepository.findById(loteDto.getProductoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no encontrado con id: " + loteDto.getProductoId()));
            lote.setProducto(producto);
        }
    }

    public Lote mapToEntity(LoteDto loteDto) {
        Lote lote = new Lote();
        lote.setNumeroLote(loteDto.getNumeroLote());
        lote.setFechaIngreso(loteDto.getFechaIngreso());
        lote.setFechaVencimiento(loteDto.getFechaVencimiento());
        lote.setCantidadStock(loteDto.getCantidadStock());
        if (loteDto.getProductoId() != null) {
            Producto producto = productoRepository.findById(loteDto.getProductoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no encontrado con id: " + loteDto.getProductoId()));
            lote.setProducto(producto);
        }
        return lote;
    }

    public LoteDto mapToDto(Lote lote) {
        LoteDto loteDto = new LoteDto();
        loteDto.setId(lote.getId());
        loteDto.setNumeroLote(lote.getNumeroLote());
        loteDto.setFechaIngreso(lote.getFechaIngreso());
        loteDto.setFechaVencimiento(lote.getFechaVencimiento());
        loteDto.setCantidadStock(lote.getCantidadStock());
        loteDto.setActivo(lote.getActivo());
        loteDto.setProductoId(lote.getProducto() != null ? lote.getProducto().getId() : null);
        return loteDto;
    }
}