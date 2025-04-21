package tipy.Stockify.api.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tipy.Stockify.services.SucursalService;

@RestController
@RequestMapping(value = "api/v1/sucursales")
public class SucursalController {

    private final SucursalService sucursalService;

    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    // Agregar todos los metodos (get, put, ...)

}
