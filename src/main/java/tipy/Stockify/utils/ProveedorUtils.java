package tipy.Stockify.utils;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Producto;
import tipy.Stockify.business.entities.Proveedor;
import tipy.Stockify.dtos.ProveedorDto;

import java.util.stream.Collectors;

@Component
public class ProveedorUtils {

    public void validateProveedorDto(ProveedorDto proveedorDto) {
        if (proveedorDto.getRut() == null || proveedorDto.getRut().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El RUT del proveedor es requerido");
        }
        if (proveedorDto.getNombre() == null || proveedorDto.getNombre().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del proveedor es requerido");
        }
    }

    public Proveedor mapToEntity(ProveedorDto proveedorDto) {
        Proveedor proveedor = new Proveedor();
        proveedor.setRut(proveedorDto.getRut());
        proveedor.setNombre(proveedorDto.getNombre());
        proveedor.setDireccion(proveedorDto.getDireccion());
        proveedor.setTelefono(proveedorDto.getTelefono());
        proveedor.setNombreVendedor(proveedorDto.getNombreVendedor());
        return proveedor;
    }

    public ProveedorDto mapToDto(Proveedor proveedor) {
        ProveedorDto proveedorDto = new ProveedorDto();
        proveedorDto.setId(proveedor.getId());
        proveedorDto.setRut(proveedor.getRut());
        proveedorDto.setNombre(proveedor.getNombre());
        proveedorDto.setDireccion(proveedor.getDireccion());
        proveedorDto.setTelefono(proveedor.getTelefono());
        proveedorDto.setNombreVendedor(proveedor.getNombreVendedor());
        proveedorDto.setActivo(proveedor.getActivo());
        proveedorDto.setProductoIds(proveedor.getProductos().stream()
                .map(Producto::getId)
                .collect(Collectors.toList()));
        return proveedorDto;
    }
}