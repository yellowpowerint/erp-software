import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it("should return health payload from the service", () => {
    const result = appController.getHealth();

    expect(result.status).toBe("ok");
    expect(result.message).toContain("Mining ERP Backend API is running");
  });
});
