package tipy.Stockify.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Conteo;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.entities.WsMensaje.ConteoMensaje;
import tipy.Stockify.business.repositories.ConteoRepository;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.ConteoDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConteoService {

    private final ConteoRepository conteoRepository;
    private final UsuarioRepository usuarioRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;


    public ConteoService(ConteoRepository conteoRepository, UsuarioRepository usuarioRepository) {
        this.conteoRepository = conteoRepository;
        this.usuarioRepository = usuarioRepository;
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
        // Asegurar que activo sea true para nuevos conteos, incluso si no se especifica
        conteo.setActivo(!conteo.isConteoFinalizado());
        Conteo saved = conteoRepository.save(conteo);

        // 2) Notifica a todos los suscriptores de /topic/conteo-activo
        messagingTemplate.convertAndSend(
                "/topic/conteo-activo",
                new ConteoMensaje(saved.getId(), saved.getFechaHora().toString())
        );

        // 3) Devuelve el DTO como antes
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
            conteo.setActivo(!finalizado); // lógica inversa
        }
        if (conteoDto.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(conteoDto.getUsuarioId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + conteoDto.getUsuarioId()));
            conteo.setUsuario(usuario);
        }
    }

    public Conteo mapToEntity(ConteoDto conteoDto) {
        Conteo conteo = new Conteo();
        conteo.setFechaHora(conteoDto.getFechaHora());
        conteo.setConteoFinalizado(conteoDto.getConteoFinalizado());
        if (conteoDto.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(conteoDto.getUsuarioId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + conteoDto.getUsuarioId()));
            conteo.setUsuario(usuario);
        }
        //activo se establece explícitamente en los métodos create/update
        return conteo;
    }

    public ConteoDto mapToDto(Conteo conteo) {
        ConteoDto conteoDto = new ConteoDto();
        conteoDto.setId(conteo.getId());
        conteoDto.setFechaHora(conteo.getFechaHora());
        conteoDto.setConteoFinalizado(conteo.isConteoFinalizado());
        conteoDto.setUsuarioId(conteo.getUsuario() != null ? conteo.getUsuario().getId() : null);
        conteoDto.setActivo(conteo.isActivo());
        return conteoDto;
    }
}