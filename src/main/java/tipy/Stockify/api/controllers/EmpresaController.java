package tipy.Stockify.api.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tipy.Stockify.services.EmpresaService;

@RestController
@RequestMapping(value = "api/v1/empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    // Agregar todos los métodos (get, put, ...)
}
