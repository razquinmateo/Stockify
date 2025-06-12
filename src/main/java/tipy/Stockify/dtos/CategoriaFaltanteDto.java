package tipy.Stockify.dtos;

public class CategoriaFaltanteDto {

    private Long categoriaId;
    private String nombreCategoria;
    private Long cantidadFaltante;

    public CategoriaFaltanteDto() { }

    public CategoriaFaltanteDto(Long categoriaId, String nombreCategoria, Long cantidadFaltante) {
        this.categoriaId = categoriaId;
        this.nombreCategoria = nombreCategoria;
        this.cantidadFaltante = cantidadFaltante;
    }

    public Long getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Long categoriaId) { this.categoriaId = categoriaId; }

    public String getNombreCategoria() { return nombreCategoria; }
    public void setNombreCategoria(String nombreCategoria) { this.nombreCategoria = nombreCategoria; }

    public Long getCantidadFaltante() { return cantidadFaltante; }
    public void setCantidadFaltante(Long cantidadFaltante) { this.cantidadFaltante = cantidadFaltante; }
}