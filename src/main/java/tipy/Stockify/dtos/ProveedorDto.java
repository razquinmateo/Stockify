package tipy.Stockify.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Data;

@Data
public class ProveedorDto {

    private long id;
    private String rut;
    private String nombre;
    private String direccion;
    private String telefono;
    private String nombreVendedor;

}
