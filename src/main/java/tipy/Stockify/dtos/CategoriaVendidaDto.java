package tipy.Stockify.dtos;

public class CategoriaVendidaDto {

    private Long categoriaId;
    private String nombreCategoria;
    private Long cantidadVendida;

    public CategoriaVendidaDto(Long categoriaId, String nombreCategoria, Long cantidadVendida) {
        this.categoriaId = categoriaId;
        this.nombreCategoria = nombreCategoria;
        this.cantidadVendida = cantidadVendida;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }

    public String getNombreCategoria() {
        return nombreCategoria;
    }

    public void setNombreCategoria(String nombreCategoria) {
        this.nombreCategoria = nombreCategoria;
    }

    public Long getCantidadVendida() {
        return cantidadVendida;
    }

    public void setCantidadVendida(Long cantidadVendida) {
        this.cantidadVendida = cantidadVendida;
    }
}
