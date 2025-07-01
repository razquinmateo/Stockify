package tipy.Stockify.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tipy.Stockify.business.repositories.ConteoUsuarioRepository;
import tipy.Stockify.dtos.ConteoUsuarioDto;
import tipy.Stockify.business.entities.Conteo;
import tipy.Stockify.business.entities.ConteoUsuario;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.repositories.ConteoRepository;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.UsuarioDto;

import java.util.List;

@Service
public class ConteoUsuarioService {

    @Autowired
    private ConteoUsuarioRepository conteoUsuarioRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private ConteoRepository conteoRepository;

    public List<ConteoUsuario> obtenerParticipantesPorConteo(Long conteoId) {
        return conteoUsuarioRepository.findByConteoId(conteoId);
    }

    public List<UsuarioDto> obtenerUsuariosPorConteo(Long conteoId) {
        return conteoUsuarioRepository.findByConteoId(conteoId)
                .stream()
                .map(ConteoUsuario::getUsuario)
                .map(usuario -> {
                    UsuarioDto dto = new UsuarioDto();
                    dto.setId(usuario.getId());
                    dto.setNombre(usuario.getNombre());
                    dto.setApellido(usuario.getApellido());
                    dto.setNombreUsuario(usuario.getNombreUsuario());
                    dto.setRol(usuario.getRol() != null ? usuario.getRol().name() : null);
                    dto.setSucursalId(usuario.getSucursal() != null ? usuario.getSucursal().getId() : null);
                    dto.setActivo(usuario.isActivo());
                    return dto;
                })
                .toList();
    }

    public ConteoUsuarioDto mapToDto(ConteoUsuario conteoUsuario) {
        ConteoUsuarioDto dto = new ConteoUsuarioDto();
        dto.setId(conteoUsuario.getId());
        dto.setUsuarioId(conteoUsuario.getUsuario().getId());
        dto.setConteoId(conteoUsuario.getConteo().getId());
        return dto;
    }

    public ConteoUsuario mapToEntity(ConteoUsuarioDto dto) {
        ConteoUsuario conteoUsuario = new ConteoUsuario();

        Usuario usuario = usuarioRepository.findByIdAndActivoTrue(dto.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado o inactivo con id: " + dto.getUsuarioId()));
        conteoUsuario.setUsuario(usuario);

        Conteo conteo = conteoRepository.findByIdAndActivoTrue(dto.getConteoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Conteo no encontrado o inactivo con id: " + dto.getConteoId()));
        conteoUsuario.setConteo(conteo);

        return conteoUsuario;
    }

    public ConteoUsuarioDto addParticipante(Long conteoId, Long usuarioId) {

        // verificamos si ya existe la relación
        boolean yaExiste = conteoUsuarioRepository.existsByConteoIdAndUsuarioId(conteoId, usuarioId);
        if (yaExiste) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya está registrado en este conteo");
        }

        // obtiene usuario y conteo existentes
        Usuario usr = usuarioRepository.findByIdAndActivoTrue(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado: " + usuarioId));
        Conteo cnt = conteoRepository.findByIdAndActivoTrue(conteoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Conteo no encontrado: " + conteoId));

        // construye y guarda la relación
        ConteoUsuario pivot = new ConteoUsuario();
        pivot.setUsuario(usr);
        pivot.setConteo(cnt);
        ConteoUsuario saved = conteoUsuarioRepository.save(pivot);

        // mapea a DTO
        ConteoUsuarioDto dto = new ConteoUsuarioDto();
        dto.setId(saved.getId());
        dto.setConteoId(cnt.getId());
        dto.setUsuarioId(usr.getId());
        dto.setNombreUsuario(usr.getNombreUsuario());
        return dto;
    }

}