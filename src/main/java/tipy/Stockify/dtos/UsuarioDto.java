package tipy.Stockify.dtos;

import jakarta.persistence.*;
import lombok.Data;
import tipy.Stockify.business.entities.enums.RolUsuario;

@Data
public class UsuarioDto {

    private Long id;
    private String nombre;
    private String apellido;
    private String nombreUsuario;
    private String contrasenia;
    private RolUsuario rol;

}
