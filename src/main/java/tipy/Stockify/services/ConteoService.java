package tipy.Stockify.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Categoria;
import tipy.Stockify.business.entities.Conteo;
import tipy.Stockify.business.entities.ConteoProducto;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.entities.WsMensaje.ConteoMensaje;
import tipy.Stockify.business.repositories.CategoriaRepository;
import tipy.Stockify.business.repositories.ConteoProductoRepository;
import tipy.Stockify.business.repositories.ConteoRepository;
import tipy.Stockify.business.repositories.ProductoRepository;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.ConteoDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConteoService {

    private final ConteoRepository conteoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final ConteoProductoRepository conteoProductoRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public ConteoService(
            ConteoRepository conteoRepository,
            UsuarioRepository usuarioRepository,
            CategoriaRepository categoriaRepository,
            ProductoRepository productoRepository,
            ConteoProductoRepository conteoProductoRepository
    ) {
        this.conteoRepository = conteoRepository;
        this.usuarioRepository = usuarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.conteoProductoRepository = conteoProductoRepository;
    }

    public List<ConteoDto> getAllActive() {
        return conteoRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ConteoDto> getAllIncludingInactive() {
        return conteoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ConteoDto getById(Long id) {
        return conteoRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ConteoDto create(ConteoDto conteoDto) {
        Conteo conteo = mapToEntity(conteoDto);
        conteo.setActivo(!conteo.isConteoFinalizado());

        // Save the conteo first to get its ID
        Conteo saved = conteoRepository.save(conteo);

        // If tipoConteo is CATEGORIAS, populate ConteoProducto with products from categories
        if (conteo.getTipoConteo() == Conteo.TipoConteo.CATEGORIAS) {
            if (conteoDto.getUsuarioId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "UsuarioId es requerido para conteos de tipo CATEGORIAS");
            }
            Usuario usuario = usuarioRepository.findById(conteoDto.getUsuarioId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + conteoDto.getUsuarioId()));
            Long sucursalId = usuario.getSucursal().getId(); // Assuming Usuario has a Sucursal reference
            List<Categoria> categorias = categoriaRepository.findByActivoTrue().stream()
                    .filter(c -> c.getSucursal().getId().equals(sucursalId))
                    .collect(Collectors.toList());

            for (Categoria categoria : categorias) {
                List<Producto> productos = productoRepository.findByActivoTrue().stream()
                        .filter(p -> p.getCategoria().getId().equals(categoria.getId()))
                        .collect(Collectors.toList());
                for (Producto producto : productos) {
                    ConteoProducto conteoProducto = new ConteoProducto();
                    conteoProducto.setConteo(saved);
                    conteoProducto.setProducto(producto);
                    conteoProducto.setPrecioActual(producto.getPrecio());
                    conteoProducto.setCantidadEsperada(producto.getCantidadStock().intValue());
                    conteoProducto.setCantidadContada(0); // Initial count is 0
                    conteoProducto.setActivo(true);
                    conteoProductoRepository.save(conteoProducto);
                }
            }
        }

        // Notify WebSocket subscribers
        messagingTemplate.convertAndSend(
                "/topic/conteo-activo",
                new ConteoMensaje(saved.getId(), saved.getFechaHora().toString())
        );

        return mapToDto(saved);
    }

    public ConteoDto update(Long id, ConteoDto conteoDto) {
        return conteoRepository.findById(id)
                .map(existingConteo -> {
                    updateConteoFields(existingConteo, conteoDto);
                    return mapToDto(conteoRepository.save(existingConteo));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Conteo conteo = conteoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteo no encontrado con id: " + id));
        conteo.setActivo(false);
        conteoRepository.save(conteo);
    }

    private void updateConteoFields(Conteo conteo, ConteoDto conteoDto) {
        if (conteoDto.getFechaHora() != null) {
            conteo.setFechaHora(conteoDto.getFechaHora());
        }
        if (conteoDto.getConteoFinalizado() != null) {
            boolean finalizado = conteoDto.getConteoFinalizado();
            conteo.setConteoFinalizado(finalizado);
            conteo.setActivo(!finalizado);
        }
        if (conteoDto.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(conteoDto.getUsuarioId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + conteoDto.getUsuarioId()));
            conteo.setUsuario(usuario);
        }
        if (conteoDto.getTipoConteo() != null) {
            try {
                conteo.setTipoConteo(Conteo.TipoConteo.valueOf(conteoDto.getTipoConteo()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de conteo inválido: " + conteoDto.getTipoConteo());
            }
        }
    }

    public Conteo mapToEntity(ConteoDto conteoDto) {
        Conteo conteo = new Conteo();
        conteo.setFechaHora(conteoDto.getFechaHora());
        conteo.setConteoFinalizado(conteoDto.getConteoFinalizado() != null ? conteoDto.getConteoFinalizado() : false);
        if (conteoDto.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(conteoDto.getUsuarioId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + conteoDto.getUsuarioId()));
            conteo.setUsuario(usuario);
        }
        if (conteoDto.getTipoConteo() != null) {
            try {
                conteo.setTipoConteo(Conteo.TipoConteo.valueOf(conteoDto.getTipoConteo()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de conteo inválido: " + conteoDto.getTipoConteo());
            }
        }
        return conteo;
    }

    public ConteoDto mapToDto(Conteo conteo) {
        ConteoDto conteoDto = new ConteoDto();
        conteoDto.setId(conteo.getId());
        conteoDto.setFechaHora(conteo.getFechaHora());
        conteoDto.setConteoFinalizado(conteo.isConteoFinalizado());
        conteoDto.setUsuarioId(conteo.getUsuario() != null ? conteo.getUsuario().getId() : null);
        conteoDto.setActivo(conteo.isActivo());
        conteoDto.setTipoConteo(conteo.getTipoConteo().name());
        return conteoDto;
    }
}