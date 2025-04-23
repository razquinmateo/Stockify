package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

@Data
public class UsuarioDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("apellido")
    private String apellido;

    @JsonProperty("nombreUsuario")
    private String nombreUsuario;

    @JsonProperty("contrasenia")
    private String contrasenia;

    @JsonProperty("rol")
    private String rol;

    @JsonProperty("sucursalId")
    private Long sucursalId;

    @JsonProperty("activo")
    private Boolean activo;
}
