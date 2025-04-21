package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.repositories.ProductoRepository;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

}
