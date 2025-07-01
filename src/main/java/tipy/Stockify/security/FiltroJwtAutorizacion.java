package tipy.Stockify.security;

import io.jsonwebtoken.*;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class FiltroJwtAutorizacion extends OncePerRequestFilter {

    private final String CLAVE = "@TI2025";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // 1) extraemos la ruta completa de la petición:
            String path = request.getRequestURI();
            // Ejemplo: "/Stockify/api/v1/estadisticas/productos-faltaron"

            // 2) si la URI contiene "/api/v1/estadisticas/", OMITIMOS la validación de JWT:
            if (path.contains("/api/v1/estadisticas/")) {
                // simplemente dejamos pasar la petición tal cual:
                filterChain.doFilter(request, response);
                return;
            }

            // 3) si llegamos aquí, NO era un endpoint de estadísticas, entonces
            //    procedemos con la validación usual de JWT:
            if (validarUsoDeToken(request)) {
                Claims claims = validarToken(request);
                if (claims.get("rol") != null) {
                    crearAutenticacion(claims);
                } else {
                    SecurityContextHolder.clearContext();
                }
            } else {
                SecurityContextHolder.clearContext();
            }

            // 4) después de autenticar (o limpiar el contexto), continuar con la cadena:
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException | UnsupportedJwtException | MalformedJwtException ex) {
            // si el token está expirado o mal formado, devolvemos 403:
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.sendError(HttpServletResponse.SC_FORBIDDEN, ex.getMessage());
        }
    }

    private void crearAutenticacion(Claims claims) {
        String rol = (String) claims.get("rol");
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                claims.getSubject(),
                null,
                List.of(new SimpleGrantedAuthority(rol))
        );
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    }

    private Claims validarToken(HttpServletRequest request) {
        // extraemos el token del header "Authorization"
        String tokenCliente = request.getHeader("Authorization").replace("Bearer ", "");
        return Jwts.parser()
                .setSigningKey(CLAVE.getBytes())
                .parseClaimsJws(tokenCliente)
                .getBody();
    }

    private boolean validarUsoDeToken(HttpServletRequest request) {
        String autenticacion = request.getHeader("Authorization");
        return autenticacion != null && autenticacion.startsWith("Bearer ");
    }
}