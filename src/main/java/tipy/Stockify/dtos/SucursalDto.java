package tipy.Stockify.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Data;

@Data
public class SucursalDto {

    private long id;
    private String nombre;
    private String direccion;
    private String telefono;

}
