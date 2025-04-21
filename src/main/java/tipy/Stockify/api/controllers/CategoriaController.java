package tipy.Stockify.api.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tipy.Stockify.services.CategoriaService;

@RestController
@RequestMapping(value = "api/v1/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    // Agregar todos los métodos (get, put, ...)
}
