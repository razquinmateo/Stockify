package tipy.Stockify.business.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SUCURSAL_PROVEEDOR")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SucursalProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "SUCURSAL_ID", nullable = false)
    private Sucursal sucursal;

    @ManyToOne
    @JoinColumn(name = "PROVEEDOR_ID", nullable = false)
    private Proveedor proveedor;
}