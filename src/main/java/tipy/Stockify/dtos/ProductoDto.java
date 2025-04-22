package tipy.Stockify.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Data;

@Data
public class ProductoDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("codigoBarra")
    private String codigoBarra;

    @JsonProperty("imagen")
    private String imagen;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("detalle")
    private String detalle;

    @JsonProperty("precio")
    private float precio;

    @JsonProperty("cantidadStock")
    private Long cantidadStock;

    @JsonProperty("sucursalId")
    private Long sucursalId;

    @JsonProperty("categoriaId")
    private Long categoriaId;

}
