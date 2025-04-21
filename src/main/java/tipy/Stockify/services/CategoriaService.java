package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.repositories.CategoriaRepository;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

}
