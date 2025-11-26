import { AppService } from "./app.service";

describe("AppService", () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it("should return a healthy status payload", () => {
    const result = service.getHealth();

    expect(result).toEqual({
      status: "ok",
      message: "Mining ERP Backend API is running",
    });
  });
});
