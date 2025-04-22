package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Conteo;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.repositories.ConteoRepository;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.ConteoDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConteoService {

    private final ConteoRepository conteoRepository;
    private final UsuarioRepository usuarioRepository;

    public ConteoService(ConteoRepository conteoRepository, UsuarioRepository usuarioRepository) {
        this.conteoRepository = conteoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<ConteoDto> getAll() {
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
        return mapToDto(conteoRepository.save(conteo));
    }

    public ConteoDto update(Long id, ConteoDto conteoDto) {
        if (conteoRepository.existsById(id)) {
            Conteo conteo = mapToEntity(conteoDto);
            conteo.setId(id);
            return mapToDto(conteoRepository.save(conteo));
        }
        return null;
    }

    public void delete(Long id) {
        conteoRepository.deleteById(id);
    }

    public Conteo mapToEntity(ConteoDto conteoDto) {
        Conteo conteo = new Conteo();
        conteo.setFechaHora(conteoDto.getFechaHora());
        conteo.setConteoFinalizado(conteoDto.isConteoFinalizado());
        if (conteoDto.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(conteoDto.getUsuarioId())
                    .orElse(null);
            conteo.setUsuario(usuario);
        }
        return conteo;
    }

    public ConteoDto mapToDto(Conteo conteo) {
        ConteoDto conteoDto = new ConteoDto();
        conteoDto.setId(conteo.getId());
        conteoDto.setFechaHora(conteo.getFechaHora());
        conteoDto.setConteoFinalizado(conteo.isConteoFinalizado());
        conteoDto.setUsuarioId(conteo.getUsuario() != null ? conteo.getUsuario().getId() : null);
        return conteoDto;
    }
}