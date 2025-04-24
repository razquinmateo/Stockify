package tipy.Stockify.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.Usuario;
import tipy.Stockify.business.repositories.UsuarioRepository;
import tipy.Stockify.dtos.LoginRequest;

import java.util.Date;
import java.util.Optional;

@Service
public class SeguridadService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final String SECRET_KEY = "@TI2025";
    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 horas

    public String autenticarUsuario(LoginRequest loginRequest) {
        Optional<Usuario> usuario = usuarioRepository.findByNombreUsuario(loginRequest.getNombreUsuario());
        if (usuario.isEmpty() ||
                !usuario.get().isActivo() ||
                !passwordEncoder.matches(loginRequest.getContrasenia(), usuario.get().getContrasenia())) {
            throw new RuntimeException("Credenciales incorrectas o usuario inactivo");
        }
        return generateToken(usuario.get());
    }

    private String generateToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getNombreUsuario())
                .claim("rol", usuario.getRol().toString())
                .claim("sucursalId", usuario.getSucursal() != null ? usuario.getSucursal().getId() : null)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS512, SECRET_KEY.getBytes())
                .compact();
    }
}