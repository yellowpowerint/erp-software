# Mining ERP - Developer Guide

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Database Management](#database-management)
6. [Testing](#testing)
7. [Code Standards](#code-standards)
8. [Contributing](#contributing)

---

## Development Environment Setup

### Prerequisites
- Node.js 22.x or higher
- PostgreSQL 15+
- Git
- VS Code (recommended) or your preferred IDE

### Initial Setup

#### 1. Clone Repository
```bash
git clone https://github.com/webblabsorg/erp.git
cd erp
```

#### 2. Backend Setup
```bash
cd dev/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3001`

#### 3. Frontend Setup
```bash
cd dev/frontend

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with backend URL

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

---

## Project Structure

```
mining-erp/
├── dev/
│   ├── backend/                 # NestJS Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── src/
│   │   │   ├── common/         # Shared utilities
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── inventory/  # Inventory management
│   │   │   │   ├── assets/     # Asset management
│   │   │   │   ├── finance/    # Finance module
│   │   │   │   ├── hr/         # HR management
│   │   │   │   ├── safety/     # Safety & compliance
│   │   │   │   ├── ai/         # AI intelligence
│   │   │   │   ├── reports/    # Reports & analytics
│   │   │   │   └── settings/   # System settings
│   │   │   ├── app.module.ts   # Root module
│   │   │   └── main.ts         # Entry point
│   │   ├── test/               # E2E tests
│   │   └── package.json
│   │
│   └── frontend/               # Next.js Frontend
│       ├── app/                # App router pages
│       │   ├── dashboard/      # Main dashboard
│       │   ├── inventory/      # Inventory pages
│       │   ├── assets/         # Asset pages
│       │   ├── finance/        # Finance pages
│       │   ├── hr/             # HR pages
│       │   ├── safety/         # Safety pages
│       │   ├── ai/             # AI features
│       │   ├── reports/        # Reports pages
│       │   └── settings/       # Settings pages
│       ├── components/         # React components
│       │   ├── auth/          # Auth components
│       │   ├── layout/        # Layout components
│       │   └── ui/            # UI components
│       ├── lib/               # Utilities
│       │   ├── api.ts         # API client
│       │   └── config/        # Configuration
│       └── package.json
│
├── docs/                      # Documentation
├── notes/                     # Development notes
└── README.md
```

---

## Backend Development

### Creating a New Module

```bash
# Generate module using NestJS CLI
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module
```

### Module Structure
```typescript
// your-module.module.ts
import { Module } from '@nestjs/common';
import { YourModuleService } from './your-module.service';
import { YourModuleController } from './your-module.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [YourModuleController],
  providers: [YourModuleService, PrismaService],
  exports: [YourModuleService],
})
export class YourModuleModule {}
```

### Creating API Endpoints

```typescript
// your-module.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { YourModuleService } from './your-module.service';

@Controller('your-module')
@UseGuards(JwtAuthGuard)
export class YourModuleController {
  constructor(private readonly service: YourModuleService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() data: any) {
    return this.service.create(data);
  }
}
```

### Adding Database Models

```prisma
// prisma/schema.prisma
model YourModel {
  id        String   @id @default(uuid())
  name      String
  status    Status   @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@map("your_models")
}

enum Status {
  ACTIVE
  INACTIVE
}
```

Run migration:
```bash
npx prisma migrate dev --name add_your_model
```

---

## Frontend Development

### Creating a New Page

```bash
# Create new page directory
mkdir -p dev/frontend/app/your-feature
touch dev/frontend/app/your-feature/page.tsx
```

### Page Structure
```typescript
'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

function YourFeatureContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/your-endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1>Your Feature</h1>
      {/* Your content */}
    </DashboardLayout>
  );
}

export default function YourFeaturePage() {
  return (
    <ProtectedRoute>
      <YourFeatureContent />
    </ProtectedRoute>
  );
}
```

### Adding to Navigation Menu

Edit `lib/config/menu.ts`:
```typescript
{
  id: 'your-feature',
  label: 'Your Feature',
  icon: YourIcon,
  path: '/your-feature',
  roles: [UserRole.SUPER_ADMIN, UserRole.CEO],
}
```

---

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema
npx prisma format
```

### Migration Best Practices
1. Always test migrations locally first
2. Use descriptive migration names
3. Review generated SQL before applying
4. Backup database before production migrations
5. Never modify existing migrations

### Common Queries

```typescript
// Find many with filters
await this.prisma.model.findMany({
  where: { status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 0,
});

// Find with relations
await this.prisma.model.findUnique({
  where: { id: itemId },
  include: { 
    relatedModel: true,
    otherRelation: {
      select: { id: true, name: true }
    }
  },
});

// Create with transaction
await this.prisma.$transaction([
  this.prisma.model1.create({ data: {...} }),
  this.prisma.model2.update({ where: {...}, data: {...} }),
]);

// Aggregate data
await this.prisma.model.groupBy({
  by: ['category'],
  _count: true,
  _sum: { amount: true },
});
```

---

## Testing

### Backend Tests

#### Unit Tests
```typescript
// your-module.service.spec.ts
import { YourModuleService } from './your-module.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('YourModuleService', () => {
  let service: YourModuleService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
    service = new YourModuleService(prisma);
  });

  it('should return all items', async () => {
    const result = await service.findAll();
    expect(result).toBeDefined();
  });
});
```

Run tests:
```bash
npm test                    # Unit tests
npm run test:watch         # Watch mode
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

#### E2E Tests
```typescript
// test/your-feature.e2e-spec.ts
describe('YourFeature E2E', () => {
  it('/api/your-endpoint (GET)', async () => {
    return request(app.getHttpServer())
      .get('/api/your-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

### Frontend Tests

```typescript
// component.test.tsx
import { render, screen } from '@testing-library/react';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('renders component', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

Run tests:
```bash
npm test                   # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report
```

---

## Code Standards

### Backend (NestJS)

#### File Naming
- Controllers: `feature.controller.ts`
- Services: `feature.service.ts`
- Modules: `feature.module.ts`
- DTOs: `create-feature.dto.ts`
- Tests: `feature.spec.ts`

#### Code Style
```typescript
// Use dependency injection
constructor(private readonly prisma: PrismaService) {}

// Use async/await
async findAll(): Promise<Model[]> {
  return await this.prisma.model.findMany();
}

// Handle errors properly
try {
  return await this.service.operation();
} catch (error) {
  throw new HttpException('Operation failed', HttpStatus.BAD_REQUEST);
}
```

### Frontend (Next.js)

#### File Naming
- Pages: `page.tsx`
- Components: `ComponentName.tsx`
- Utilities: `util-name.ts`
- Tests: `component.test.tsx`

#### Code Style
```typescript
// Use TypeScript interfaces
interface DataType {
  id: string;
  name: string;
}

// Use proper state management
const [data, setData] = useState<DataType[]>([]);

// Use useEffect for data fetching
useEffect(() => {
  fetchData();
}, []);

// Handle loading and error states
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
```

### Linting

```bash
# Backend
npm run lint              # Check for issues
npm run lint -- --fix     # Auto-fix issues

# Frontend
npm run lint              # Check for issues
```

---

## Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch (if using)
- `feature/name`: New features
- `fix/name`: Bug fixes

### Commit Messages
```
Type: Brief description

Detailed explanation if needed

Types: feat, fix, docs, refactor, test, chore
```

Examples:
```
feat: Add asset depreciation calculation

fix: Resolve inventory stock count bug

docs: Update API documentation for finance module

test: Add E2E tests for approval workflow
```

### Pull Request Process
1. Create feature branch
2. Make changes and commit
3. Run tests and linting
4. Push to GitHub
5. Create pull request with description
6. Wait for review and CI checks
7. Merge after approval

---

## Debugging

### Backend Debugging
```bash
# Start with debug mode
npm run start:debug

# VSCode launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229,
  "restart": true
}
```

### Frontend Debugging
- Use React DevTools browser extension
- Use console.log for quick debugging
- Use debugger statement for breakpoints
- Check Network tab for API calls

### Database Debugging
```bash
# Open Prisma Studio
npx prisma studio

# View query logs
# Add to schema.prisma:
generator client {
  provider = "prisma-client-js"
  log = ["query", "info", "warn", "error"]
}
```

---

## Common Development Tasks

### Add New API Endpoint
1. Define DTO for request validation
2. Add method to service
3. Add route to controller
4. Test endpoint locally
5. Add to API documentation

### Add New Frontend Page
1. Create page component in app directory
2. Add to navigation menu (if needed)
3. Implement data fetching
4. Add loading and error states
5. Style with Tailwind CSS
6. Test responsive design

### Update Database Schema
1. Modify `schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Update TypeScript types
4. Update affected services
5. Test thoroughly

---

## Performance Optimization

### Backend
- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Use select to limit returned fields
- Cache frequently accessed data
- Use connection pooling

### Frontend
- Use React.memo for expensive components
- Implement lazy loading for large pages
- Optimize images (Next.js Image component)
- Use dynamic imports for heavy components
- Minimize bundle size

### Database
- Add indexes: `@@index([field])`
- Use raw SQL for complex queries
- Implement query optimization
- Monitor slow query log

---

## Security Considerations

### Backend
- Always use `@UseGuards(JwtAuthGuard)` for protected routes
- Validate all input with DTOs and class-validator
- Sanitize user inputs
- Use parameterized queries (Prisma handles this)
- Hash passwords with bcrypt
- Implement rate limiting

### Frontend
- Store tokens securely (httpOnly cookies preferred)
- Don't expose API keys in client code
- Validate forms before submission
- Handle authentication errors
- Implement CSRF protection

---

## Environment Variables

### Backend Required
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
```

### Frontend Required
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### Optional Variables
```env
# AI Features
OPENAI_API_KEY="your-key"

# Email
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-smtp-password"

# SMS
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE="..."
```

---

## CI/CD Pipeline

### GitHub Actions (Example)

```yaml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install Backend Dependencies
        run: cd dev/backend && npm ci
      
      - name: Run Backend Tests
        run: cd dev/backend && npm test
      
      - name: Run Backend Linting
        run: cd dev/backend && npm run lint
      
      - name: Install Frontend Dependencies
        run: cd dev/frontend && npm ci
      
      - name: Run Frontend Tests
        run: cd dev/frontend && npm test
      
      - name: Run Frontend Linting
        run: cd dev/frontend && npm run lint
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Check Node version
node --version  # Should be 22.x

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npx prisma generate

# Check database connection
npx prisma db pull
```

### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check for type errors
npm run type-check
```

### Database Migration Issues
```bash
# View migration status
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset

# Force deploy migrations
npx prisma migrate deploy --force
```

---

## Useful Commands

### Backend
```bash
npm run start:dev          # Development with hot-reload
npm run start:debug        # Debug mode
npm run build              # Build for production
npm run start:prod         # Run production build
npm test                   # Run tests
npm run test:e2e          # Run E2E tests
npm run lint              # Check code style
npm run format            # Format code
```

### Frontend
```bash
npm run dev               # Development server
npm run build             # Build for production
npm start                 # Run production build
npm test                  # Run tests
npm run lint              # Check code style
npm run type-check        # TypeScript checking
```

### Database
```bash
npx prisma studio         # Open database GUI
npx prisma migrate dev    # Create and apply migration
npx prisma migrate deploy # Apply migrations (prod)
npx prisma db push        # Push schema without migration
npx prisma db seed        # Seed database
npx prisma format         # Format schema file
```

---

## Resources

### Documentation
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Tools
- [Prisma Studio](https://www.prisma.io/studio): Database GUI
- [Postman](https://www.postman.com): API testing
- [React DevTools](https://react.dev/learn/react-developer-tools): React debugging

---

## Getting Help

### Internal Resources
- Check existing code for patterns
- Review pull request history
- Ask in team chat/slack

### External Resources
- Stack Overflow for specific issues
- GitHub Issues for library bugs
- Official documentation

---

## Contributing

### Before Submitting PR
1. ✅ All tests passing
2. ✅ Linting passing
3. ✅ No TypeScript errors
4. ✅ Code follows project conventions
5. ✅ Documentation updated
6. ✅ Tested locally

### Code Review Checklist
- Code is clean and readable
- No commented-out code
- No console.logs in production code
- Error handling implemented
- Edge cases considered
- Performance implications reviewed

---

**Developer Guide Last Updated**: November 26, 2025  
**Maintained by**: Development Team
