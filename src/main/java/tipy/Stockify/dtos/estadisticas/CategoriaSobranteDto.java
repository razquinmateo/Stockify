package tipy.Stockify.dtos.estadisticas;

public class CategoriaSobranteDto {

    private Long categoriaId;
    private String nombreCategoria;
    private Long cantidadSobrante;

    public CategoriaSobranteDto() { }

    public CategoriaSobranteDto(Long categoriaId, String nombreCategoria, Long cantidadSobrante) {
        this.categoriaId = categoriaId;
        this.nombreCategoria = nombreCategoria;
        this.cantidadSobrante = cantidadSobrante;
    }

    public Long getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Long categoriaId) { this.categoriaId = categoriaId; }

    public String getNombreCategoria() { return nombreCategoria; }
    public void setNombreCategoria(String nombreCategoria) { this.nombreCategoria = nombreCategoria; }

    public Long getCantidadSobrante() { return cantidadSobrante; }
    public void setCantidadSobrante(Long cantidadSobrante) { this.cantidadSobrante = cantidadSobrante; }
}