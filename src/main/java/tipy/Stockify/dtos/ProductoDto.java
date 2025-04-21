package tipy.Stockify.dtos;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Data;

@Data
public class ProductoDto {

    private long id;
    private String codigoBarra;
    private String imagen;
    private String nombre;
    private String detalle;
    private Float precio;
    private long cantidadStock;

}
