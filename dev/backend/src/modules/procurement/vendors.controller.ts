import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { multerConfig } from "../documents/config/multer.config";
import {
  CreateVendorContactDto,
  CreateVendorDocumentDto,
  CreateVendorDto,
  CreateVendorEvaluationDto,
  CreateVendorProductDto,
  UpdateVendorDto,
  UpdateVendorProductDto,
  VendorStatusActionDto,
} from "./dto";
import { VendorsService } from "./vendors.service";

@Controller("procurement/vendors")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  create(@Body() dto: CreateVendorDto, @CurrentUser() user: any) {
    return this.vendorsService.createVendor(dto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  list(@Query() query: any, @CurrentUser() user: any) {
    return this.vendorsService.listVendors(query, user);
  }

  @Get("search")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  search(@Query("query") query: string, @CurrentUser() user: any) {
    return this.vendorsService.listVendors({ search: query }, user);
  }

  @Get("by-category/:cat")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  byCategory(@Param("cat") cat: string, @CurrentUser() user: any) {
    return this.vendorsService.byCategory(cat, user);
  }

  @Get("preferred")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  preferred(@CurrentUser() user: any) {
    return this.vendorsService.preferredVendors(user);
  }

  @Get("expiring-docs")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
  )
  expiringDocs(@Query("days") days: string, @CurrentUser() user: any) {
    const num = days ? Number(days) : 30;
    return this.vendorsService.expiringDocuments(user, Number.isFinite(num) ? num : 30);
  }

  @Get("stats")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  stats(@CurrentUser() user: any) {
    return this.vendorsService.stats(user);
  }

  @Get(":id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.vendorsService.getVendorById(id, user);
  }

  @Put(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  update(@Param("id") id: string, @Body() dto: UpdateVendorDto, @CurrentUser() user: any) {
    return this.vendorsService.updateVendor(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  delete(@Param("id") id: string, @CurrentUser() user: any) {
    return this.vendorsService.deleteVendor(id, user);
  }

  @Post(":id/approve")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  approve(@Param("id") id: string, @Body() dto: VendorStatusActionDto, @CurrentUser() user: any) {
    return this.vendorsService.approveVendor(id, dto, user);
  }

  @Post(":id/suspend")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  suspend(@Param("id") id: string, @Body() dto: VendorStatusActionDto, @CurrentUser() user: any) {
    return this.vendorsService.suspendVendor(id, dto, user);
  }

  @Post(":id/blacklist")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  blacklist(@Param("id") id: string, @Body() dto: VendorStatusActionDto, @CurrentUser() user: any) {
    return this.vendorsService.blacklistVendor(id, dto, user);
  }

  @Post(":id/reactivate")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  reactivate(@Param("id") id: string, @Body() dto: VendorStatusActionDto, @CurrentUser() user: any) {
    return this.vendorsService.reactivateVendor(id, dto, user);
  }

  @Post(":id/contacts")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  addContact(
    @Param("id") vendorId: string,
    @Body() dto: CreateVendorContactDto,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.addContact(vendorId, dto, user);
  }

  @Get(":id/documents")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  listDocuments(@Param("id") vendorId: string, @CurrentUser() user: any) {
    return this.vendorsService.listDocuments(vendorId, user);
  }

  @Post(":id/documents")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  @UseInterceptors(FileInterceptor("file", multerConfig))
  uploadDocument(
    @Param("id") vendorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateVendorDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.uploadDocument(vendorId, file, dto, user);
  }

  @Get(":id/products")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.SAFETY_OFFICER,
  )
  listProducts(@Param("id") vendorId: string, @CurrentUser() user: any) {
    return this.vendorsService.listProducts(vendorId, user);
  }

  @Post(":id/products")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  addProduct(
    @Param("id") vendorId: string,
    @Body() dto: CreateVendorProductDto,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.addProduct(vendorId, dto, user);
  }

  @Put(":id/products/:productId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER)
  updateProduct(
    @Param("id") vendorId: string,
    @Param("productId") productId: string,
    @Body() dto: UpdateVendorProductDto,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.updateProduct(vendorId, productId, dto, user);
  }

  @Get(":id/evaluations")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.DEPARTMENT_HEAD,
  )
  listEvaluations(@Param("id") vendorId: string, @CurrentUser() user: any) {
    return this.vendorsService.listEvaluations(vendorId, user);
  }

  @Post(":id/evaluations")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.DEPARTMENT_HEAD,
  )
  evaluate(
    @Param("id") vendorId: string,
    @Body() dto: CreateVendorEvaluationDto,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.evaluateVendor(vendorId, dto, user);
  }

  @Get(":id/performance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.DEPARTMENT_HEAD,
  )
  performance(@Param("id") vendorId: string, @CurrentUser() user: any) {
    return this.vendorsService.getPerformance(vendorId, user);
  }
}
