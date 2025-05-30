package tipy.Stockify.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(new FiltroJwtAutorizacion(), UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(antMatcher("/api/v1/seguridad/**")).permitAll()
                        .requestMatchers(antMatcher("/v3/api-docs/**")).permitAll()
                        .requestMatchers(antMatcher("/swagger-ui/**")).permitAll()
                        .requestMatchers(antMatcher("/swagger-resources/**")).permitAll()
                        .requestMatchers(antMatcher("/configuration/**")).permitAll()

                                // dejar pasar la conexión SockJS
                                .requestMatchers("/ws/**", "/topic/**").permitAll()

                        .requestMatchers(antMatcher("/api/v1/empresas/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/sucursales/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/sucursal-proveedor/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/usuarios/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/productos/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/categorias/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/conteos/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/conteoproducto/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/lotes/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/proveedores/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/reportes/**")).permitAll()
                        .requestMatchers(antMatcher("/api/v1/conteo-usuarios/**")).permitAll()

//                        .requestMatchers(antMatcher("/api/v1/empresas/**")).hasAuthority("SUPERADMINISTRADOR")
//                        .requestMatchers(antMatcher("/api/v1/sucursales/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/usuarios/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/productos/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/categorias/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/conteos/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/conteoproducto/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/lotes/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/proveedores/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")
//                        .requestMatchers(antMatcher("/api/v1/reportes/**")).hasAnyAuthority("SUPERADMINISTRADOR", "ADMINISTRADOR", "EMPLEADO")

                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}