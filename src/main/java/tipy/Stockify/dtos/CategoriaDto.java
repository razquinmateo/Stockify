package tipy.Stockify.dtos;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class CategoriaDto {

    private long id;
    private String nombre;
    private String descripcion;

}
