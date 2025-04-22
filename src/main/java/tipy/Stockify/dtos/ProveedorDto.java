package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Data;

@Data
public class ProveedorDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("rut")
    private String rut;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("direccion")
    private String direccion;

    @JsonProperty("telefono")
    private String telefono;

    @JsonProperty("nombreVendedor")
    private String nombreVendedor;

}
