package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.enums.RolUsuario;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.UsuarioDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, SucursalRepository sucursalRepository) {
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
    }

    public List<UsuarioDto> getAll() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UsuarioDto getById(Long id) {
        return usuarioRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public UsuarioDto create(UsuarioDto usuarioDto) {
        Usuario usuario = mapToEntity(usuarioDto);
        return mapToDto(usuarioRepository.save(usuario));
    }

    public UsuarioDto update(Long id, UsuarioDto usuarioDto) {
        if (usuarioRepository.existsById(id)) {
            Usuario usuario = mapToEntity(usuarioDto);
            usuario.setId(id);
            return mapToDto(usuarioRepository.save(usuario));
        }
        return null;
    }

    public void delete(Long id) {
        usuarioRepository.deleteById(id);
    }

    public Usuario mapToEntity(UsuarioDto usuarioDto) {
        Usuario usuario = new Usuario();
        usuario.setNombre(usuarioDto.getNombre());
        usuario.setApellido(usuarioDto.getApellido());
        usuario.setNombreUsuario(usuarioDto.getNombreUsuario());
        usuario.setContrasenia(usuarioDto.getContrasenia());
        usuario.setRol(usuarioDto.getRol() != null ? RolUsuario.valueOf(usuarioDto.getRol()) : null);
        if (usuarioDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(usuarioDto.getSucursalId())
                    .orElse(null);
            usuario.setSucursal(sucursal);
        }
        return usuario;
    }

    public UsuarioDto mapToDto(Usuario usuario) {
        UsuarioDto usuarioDto = new UsuarioDto();
        usuarioDto.setId(usuario.getId());
        usuarioDto.setNombre(usuario.getNombre());
        usuarioDto.setApellido(usuario.getApellido());
        usuarioDto.setNombreUsuario(usuario.getNombreUsuario());
        usuarioDto.setContrasenia(usuario.getContrasenia());
        usuarioDto.setRol(usuario.getRol() != null ? usuario.getRol().name() : null);
        usuarioDto.setSucursalId(usuario.getSucursal() != null ? usuario.getSucursal().getId() : null);
        return usuarioDto;
    }
}