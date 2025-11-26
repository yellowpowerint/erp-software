import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  console.log("🔧 Starting Mining ERP Backend...");
  console.log(
    "📊 Database URL:",
    process.env.DATABASE_URL ? "Connected" : "Not configured",
  );

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📍 API available at /api`);
  console.log(`✅ Server started successfully!`);
}
bootstrap();
