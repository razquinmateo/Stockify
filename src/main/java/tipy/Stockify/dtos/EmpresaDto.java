package tipy.Stockify.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Data;

@Data
public class EmpresaDto {

    private long id;
    private String nombre;
    private String rut;
    private String direccion;
    private String telefono;

}
