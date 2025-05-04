package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.enums.RolUsuario;
import tipy.Stockify.business.entities.Sucursal;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.repositories.SucursalRepository;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.UsuarioDto;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, SucursalRepository sucursalRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioDto> getAllActive() {
        return usuarioRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<UsuarioDto> getAllIncludingInactive() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UsuarioDto getById(Long id) {
        return usuarioRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public UsuarioDto create(UsuarioDto usuarioDto) {
        Usuario usuario = mapToEntity(usuarioDto);
        //encriptamos la contraseña
        if (usuarioDto.getContrasenia() != null) {
            usuario.setContrasenia(passwordEncoder.encode(usuarioDto.getContrasenia()));
        }
        //nos aseguramos que activo sea true para nuevos usuarios
        usuario.setActivo(true);
        return mapToDto(usuarioRepository.save(usuario));
    }

    public UsuarioDto update(Long id, UsuarioDto usuarioDto) {
        return usuarioRepository.findById(id)
                .map(existingUsuario -> {
                    updateUsuarioFields(existingUsuario, usuarioDto);
                    return mapToDto(usuarioRepository.save(existingUsuario));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + id));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    private void updateUsuarioFields(Usuario usuario, UsuarioDto usuarioDto) {
        if (usuarioDto.getNombre() != null) {
            usuario.setNombre(usuarioDto.getNombre());
        }
        if (usuarioDto.getApellido() != null) {
            usuario.setApellido(usuarioDto.getApellido());
        }
        if (usuarioDto.getNombreUsuario() != null) {
            usuario.setNombreUsuario(usuarioDto.getNombreUsuario());
        }
        if (usuarioDto.getContrasenia() != null) {
            usuario.setContrasenia(passwordEncoder.encode(usuarioDto.getContrasenia()));
        }
        if (usuarioDto.getRol() != null) {
            usuario.setRol(RolUsuario.valueOf(usuarioDto.getRol()));
        }
        if (usuarioDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(usuarioDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + usuarioDto.getSucursalId()));
            usuario.setSucursal(sucursal);
        }
        if (usuarioDto.getActivo() != null) {
            usuario.setActivo(usuarioDto.getActivo());
        }
    }

    public Usuario mapToEntity(UsuarioDto usuarioDto) {
        Usuario usuario = new Usuario();
        usuario.setNombre(usuarioDto.getNombre());
        usuario.setApellido(usuarioDto.getApellido());
        usuario.setNombreUsuario(usuarioDto.getNombreUsuario());
        //la contraseña se encripta en create/update, no aca
        usuario.setRol(usuarioDto.getRol() != null ? RolUsuario.valueOf(usuarioDto.getRol()) : null);
        if (usuarioDto.getSucursalId() != null) {
            Sucursal sucursal = sucursalRepository.findById(usuarioDto.getSucursalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada con id: " + usuarioDto.getSucursalId()));
            usuario.setSucursal(sucursal);
        }
        //activo se establece explícitamente en los métodos create/update
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
        usuarioDto.setActivo(usuario.isActivo());
        return usuarioDto;
    }

    //solo usuarios activos y con rol "EMPLEADO".
    public List<UsuarioDto> getEmpleadosActivos() {
        return getAllIncludingInactive()
                .stream()
                .filter(usuario -> "EMPLEADO".equals(usuario.getRol()))
                .collect(Collectors.toList());
    }

}