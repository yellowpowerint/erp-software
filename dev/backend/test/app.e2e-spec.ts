import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";

describe("App E2E", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/api/health (GET) returns healthy status", async () => {
    await request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            status: "ok",
          }),
        );
      });
  });

  it("/api/auth/me (GET) rejects unauthenticated request", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
  });

  it("health endpoint responds within an acceptable time", async () => {
    const start = Date.now();
    await request(app.getHttpServer()).get("/api/health").expect(200);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
