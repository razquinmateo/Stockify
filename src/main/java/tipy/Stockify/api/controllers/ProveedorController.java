package tipy.Stockify.api.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tipy.Stockify.services.ProveedorService;

@RestController
@RequestMapping(value = "api/v1/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    // Agregar todos los metodos (get, put, ...)

}
