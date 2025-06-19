package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ProductoDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("codigosBarra")
    private List<String> codigosBarra = new ArrayList<>();

    @JsonProperty("imagen")
    private String imagen;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("detalle")
    private String detalle;

    @JsonProperty("precio")
    private Float precio;

    @JsonProperty("cantidadStock")
    private Long cantidadStock;

    @JsonProperty("sucursalId")
    private Long sucursalId;

    @JsonProperty("categoriaId")
    private Long categoriaId;

    @JsonProperty("activo")
    private Boolean activo;

    @JsonProperty("proveedorIds")
    private List<Long> proveedorIds = new ArrayList<>();
}