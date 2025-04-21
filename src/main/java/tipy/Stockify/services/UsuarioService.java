package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.api.responses.ResponseUsuarios;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.UsuarioDto;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Se llama al repositorio para obtener todos los usuarios y mandarlos al controlador
    public ResponseUsuarios listadoUsuarios() {
        ResponseUsuarios responseUsuarios = new ResponseUsuarios();

        responseUsuarios.setUsuarios(usuarioRepository.findAll().stream().map(this::mapToDto).toList());

        return responseUsuarios;
    }

    // Crea un usuario simepre y cuando no se especifique un id
    public String crearUsuario(UsuarioDto usuario) {
        String response = null;

        if (usuario.getId() == null) {
            response = "Usuario creado: " + usuarioRepository.save(mapToEntity(usuario)).getId();
        }

        return response;
    }

    // Elimina un usuario utilizando el id
    public void eliminarUsuario(Long idUsuario) {
        usuarioRepository.deleteById(idUsuario);
    }

    // Modifica un usuario utilizando el id
    public String modificarUsuario(Long idUsuario, UsuarioDto usuario) {
        String response = null;

        Usuario modifierUser = usuarioRepository.findById(idUsuario).orElseThrow(() -> new RuntimeException("El usuario no existe."));
        modifierUser.setNombre(usuario.getNombre());
        modifierUser.setApellido(usuario.getApellido());
        modifierUser.setNombreUsuario(usuario.getNombreUsuario());
        modifierUser.setContrasenia(usuario.getContrasenia());
        modifierUser.setRol(usuario.getRol());

        usuarioRepository.save(modifierUser);

        return response;
    }

    public Usuario mapToEntity(UsuarioDto usuarioDto) {
        Usuario usuario = new Usuario();

        usuario.setId(usuarioDto.getId());
        usuario.setNombre(usuarioDto.getNombre());
        usuario.setApellido(usuarioDto.getApellido());
        usuario.setNombreUsuario(usuarioDto.getNombreUsuario());
        usuario.setContrasenia(usuarioDto.getContrasenia());
        usuario.setRol(usuarioDto.getRol());

        return usuario;
    }

    public UsuarioDto mapToDto(Usuario usuario) {
        UsuarioDto usuarioDto = new UsuarioDto();

        usuarioDto.setId(usuarioDto.getId());
        usuarioDto.setNombre(usuario.getNombre());
        usuarioDto.setApellido(usuario.getApellido());
        usuarioDto.setNombreUsuario(usuario.getNombreUsuario());
        usuarioDto.setContrasenia(usuario.getContrasenia());
        usuarioDto.setRol(usuario.getRol());

        return usuarioDto;
    }

}
