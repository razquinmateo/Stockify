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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
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
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException | UnsupportedJwtException | MalformedJwtException ex) {
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
        String tokenCliente = request.getHeader("Authorization").replace("Bearer ", "");
        return Jwts.parser().setSigningKey(CLAVE.getBytes()).parseClaimsJws(tokenCliente).getBody();
    }

    private boolean validarUsoDeToken(HttpServletRequest request) {
        String autenticacion = request.getHeader("Authorization");
        return autenticacion != null && autenticacion.startsWith("Bearer ");
    }
}