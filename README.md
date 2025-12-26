# Network Registry API

Blockchain Network Registry API - NestJS microservice for managing blockchain network configurations.

## Prerequisites

- Node.js >= 22.0.0
- Docker and Docker Compose

## Quick Start

```bash
# Install dependencies
npm install

# Start PostgreSQL database
docker-compose up -d postgres

# Run database migrations
npm run migration:latest

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api-docs`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Architecture

This service follows **Clean/Hexagonal Architecture** principles, ensuring clear separation of concerns and high testability.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DRIVING ADAPTERS                                │
│                    (Entry Points / Primary Ports)                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  REST API Controllers  │  Guards  │  Filters  │  Middleware     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                │
│                         (Use Cases)                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CreateNetwork  │  GetNetworkById  │  UpdateNetwork  │  ...     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DOMAIN LAYER                                   │
│                    (Models & Gateway Interfaces)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Network Model  │  NetworkRepository (abstract)  │  ILogger     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                         DRIVEN ADAPTERS                                 │
│                  (Infrastructure / Secondary Ports)                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PostgresRepository  │  DatabaseService  │  LoggerService       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer Descriptions

#### Domain Layer (`src/domain/`)
The core of the application containing business entities and abstract interfaces (ports).

- **Models**: Pure TypeScript interfaces representing business entities (`Network`)
- **Gateways**: Abstract classes defining contracts for external dependencies (`NetworkRepository`)

The domain layer has **no dependencies** on external libraries or frameworks.

#### Application Layer (`src/application/`)
Contains use cases that orchestrate the business logic.

- **Use Cases**: Single-purpose classes with an `execute()` method
- Each use case represents one business operation (e.g., `CreateNetworkUseCase`)
- Use cases depend only on domain abstractions, not concrete implementations

#### Infrastructure Layer (`src/infrastructure/`)
Implements the interfaces defined in the domain layer.

**Driving Adapters** (`driving-adapters/`):
- REST API Controllers - Handle HTTP requests
- DTOs - Request/response data validation
- Guards - JWT authentication
- Filters - Global exception handling
- Middleware - Logging and correlation ID

**Driven Adapters** (`driven-adapters/`):
- PostgresNetworkRepository - Database operations via Knex.js
- DatabaseService - Database connection management
- LoggerService - Structured logging
- AppConfigService - Configuration management

### Domain Model

```typescript
interface Network {
  id: string;                    // UUID
  chainId: number;               // Unique blockchain chain ID
  name: string;                  // Network name (e.g., "Ethereum Mainnet")
  rpcUrl: string;                // Primary RPC endpoint
  otherRpcUrls: string[];        // Fallback RPC endpoints
  testNet: boolean;              // Is testnet flag
  blockExplorerUrl: string;      // Block explorer URL
  feeMultiplier: number;         // Gas fee multiplier
  gasLimitMultiplier: number;    // Gas limit multiplier
  active: boolean;               // Soft delete flag
  defaultSignerAddress: string;  // Default Ethereum address
  createdAt: Date;
  updatedAt: Date;
}
```

### Dependency Rule

Dependencies flow **inward** toward the domain layer:

```
Infrastructure → Application → Domain
```

- The domain layer knows nothing about the outer layers
- The application layer depends only on domain abstractions
- Infrastructure implements domain interfaces via dependency injection

### Key Design Patterns

| Pattern | Implementation |
|---------|----------------|
| Repository | Abstract `NetworkRepository` gateway with `PostgresNetworkRepository` implementation |
| Use Case | Each business operation encapsulated in a single-purpose class |
| Dependency Injection | NestJS DI container with interface-based injection |
| DTO Validation | class-validator decorators for request validation |
| Soft Delete | `active` flag instead of physical deletion |

## Testing

```bash
# Start test database
docker-compose up -d postgres-test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Test Strategy

| Layer | Test Type | Purpose |
|-------|-----------|---------|
| Use Cases | Unit Tests | Business logic in isolation with mocked dependencies |
| Repository | Integration Tests | Database operations against real PostgreSQL |
| Controllers | Unit Tests | Request handling with mocked use cases |
| API | E2E Tests | Full request/response cycle |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /networks | Create a new network |
| GET | /networks | Get all active networks |
| GET | /networks/:id | Get network by ID |
| PUT | /networks/:id | Full update of network |
| PATCH | /networks/:id | Partial update of network |
| DELETE | /networks/:id | Soft delete network |

All endpoints require JWT authentication via Bearer token.

## Project Structure

```
src/
├── application/
│   └── use-cases/
│       └── networks/
│           ├── create-network/
│           ├── get-network-by-id/
│           ├── get-active-networks/
│           ├── update-network/
│           ├── partial-update-network/
│           └── delete-network/
├── domain/
│   ├── models/
│   │   └── network.model.ts
│   └── gateways/
│       └── network-repository.gateway.ts
├── infrastructure/
│   ├── driving-adapters/
│   │   └── api-rest/
│   │       ├── controllers/
│   │       ├── dto/
│   │       ├── guards/
│   │       ├── filters/
│   │       ├── decorators/
│   │       └── middleware/
│   └── driven-adapters/
│       ├── database/
│       ├── network-repository/
│       ├── config/
│       └── logger/
├── shared/
│   └── errors/
└── types/
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS | Application framework |
| TypeScript | Type safety |
| PostgreSQL | Primary database |
| Knex.js | SQL query builder |
| class-validator | DTO validation |
| JWT | Authentication |
| Jest | Testing framework |
| Swagger | API documentation |
