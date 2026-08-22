import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './empresas/empresas.module';
import { MiembrosModule } from './miembros/miembros.module';
import { PlanesModule } from './planes/planes.module';
import { FacturasModule } from './facturas/facturas.module';
import { InventarioModule } from './inventario/inventario.module';
import { MaquinasModule } from './maquinas/maquinas.module';
import { RutinasModule } from './rutinas/rutinas.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { ConfigModule } from './config/config.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    EmpresasModule,
    MiembrosModule,
    PlanesModule,
    FacturasModule,
    InventarioModule,
    MaquinasModule,
    RutinasModule,
    ColaboradoresModule,
    ConfigModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
