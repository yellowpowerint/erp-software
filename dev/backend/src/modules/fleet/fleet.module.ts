import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { FleetAssetsController } from "./fleet-assets.controller";
import { FleetAssignmentsController } from "./fleet-assignments.controller";
import { FleetService } from "./fleet.service";

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [FleetAssetsController, FleetAssignmentsController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}
