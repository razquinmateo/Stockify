package tipy.Stockify.utils;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.entities.enums.RolUsuario;
import tipy.Stockify.business.repositories.UsuarioRepository;

@Component
public class TesteoBD implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;

    public TesteoBD(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void run(String... args) throws Exception {
//        Usuario user = new Usuario();
//        user.setNombre("Mateo");
//        user.setApellido("Razquin");
//        user.setNombreUsuario("mateo.razquin");
//        user.setContrasenia("12345");
//        user.setRol(RolUsuario.SUPERADMINISTRADOR);
//
//        usuarioRepository.save(user);
    }
}
