package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

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

    @JsonProperty("activo")
    private Boolean activo;

    @JsonProperty("productoIds")
    private List<Long> productoIds = new ArrayList<>();
}