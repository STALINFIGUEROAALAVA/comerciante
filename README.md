# Billing System with Inventory Management

A full-featured billing system built with Deno Fresh and PostgreSQL, featuring comprehensive inventory management with multi-warehouse support, stock tracking, and role-based access control.

## Features

### Core Functionality
- **Authentication & Authorization**: Secure login with bcrypt password hashing, HTTP-only session cookies (SameSite=Lax), and role-based UI (admin/ventas)
- **Product Management**: Complete CRUD operations for product catalog
- **Customer Management**: Manage customer information with CRUD operations
- **Invoice Management**: Create invoices with multiple items, automatic stock deduction, and payment tracking
- **Multi-Warehouse Inventory**: Track stock across multiple warehouse locations

### Advanced Inventory Features
- **Stock Ledger (Kardex)**: Complete transaction history for each product/warehouse combination with unit cost and value tracking
- **Warehouse Transfers**: Transfer stock between warehouses with transactional validation to prevent negative stock
- **Inventory Adjustments**: Submit adjustment requests with approval workflow:
  - Users can submit adjustments (increase/decrease)
  - Only admins can approve or reject adjustments
  - Approved adjustments update stock and create ledger entries at the effective date
- **Inventory Periods**: Close accounting periods to prevent backdated transactions
  - Admin-only feature to create and close periods
  - All stock-affecting operations validate against closed periods
- **Valuation Report**: Generate inventory valuation reports using moving average cost method by product/warehouse at any cutoff date

## Tech Stack

- **Framework**: Deno Fresh 1.7.3
- **UI**: Preact with Islands architecture
- **Database**: PostgreSQL with deno_postgres connection pool
- **Styling**: Tailwind CSS
- **Authentication**: bcrypt for password hashing
- **Environment**: dotenv for configuration

## Prerequisites

- [Deno](https://deno.land/) installed (v1.37 or later)
- [Docker](https://www.docker.com/) and Docker Compose (for database)
- PostgreSQL (via Docker or standalone)

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd comerciante
```

### 2. Setup environment variables

Copy the example environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=billing_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
PORT=8000
SESSION_SECRET=change-this-to-a-random-secret-in-production
```

### 3. Start PostgreSQL (using Docker)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Adminer (database UI) on port 8080

Access Adminer at http://localhost:8080 with:
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres
- Database: billing_db

### 4. Run database migrations

```bash
deno task migrate
```

This creates all necessary tables and inserts default users:
- Admin user: `admin` / `admin123`
- Sales user: `ventas` / `sales123`

### 5. Start the development server

```bash
deno task dev
```

The application will be available at http://localhost:8000

## Usage

### Default Login Credentials

After running migrations, you can log in with:

**Admin User:**
- Username: `admin`
- Password: `admin123`
- Access: Full system access including period management and adjustment approvals

**Sales User:**
- Username: `ventas`
- Password: `sales123`
- Access: Can create invoices, manage products/customers, submit adjustments

### Creating Additional Users

To create a new user, first generate a password hash:

```bash
deno task hash <your-password>
```

Then insert the user into the database using the generated hash.

## Application Structure

```
comerciante/
├── db/
│   ├── client.ts          # PostgreSQL connection pool
│   └── schema.sql         # Complete database schema
├── services/              # Business logic layer
│   ├── productService.ts
│   ├── invoiceService.ts
│   ├── warehouseService.ts
│   ├── transferService.ts
│   ├── adjustmentService.ts
│   ├── cost.ts           # Moving average cost calculations
│   └── periodService.ts
├── routes/
│   ├── _app.tsx          # Application layout
│   ├── index.tsx         # Dashboard
│   ├── login.tsx         # Login page
│   ├── products.tsx      # Product management
│   ├── customers.tsx     # Customer management
│   ├── warehouses.tsx    # Warehouse management
│   ├── transfers.tsx     # Stock transfers
│   ├── adjustments.tsx   # Inventory adjustments
│   ├── kardex.tsx        # Stock ledger viewer
│   ├── valuation.tsx     # Valuation report
│   ├── periods.tsx       # Period management (admin only)
│   ├── invoices/
│   │   ├── index.tsx     # Invoice list
│   │   ├── new.tsx       # Create invoice
│   │   └── [id].tsx      # Invoice details
│   └── api/              # REST API endpoints
│       ├── auth/
│       ├── products.ts
│       ├── customers.ts
│       ├── invoices.ts
│       ├── warehouses.ts
│       ├── transfers.ts
│       ├── adjustments.ts
│       ├── periods.ts
│       ├── kardex.ts
│       └── valuation.ts
├── islands/              # Interactive Preact components
│   ├── ProductForm.tsx
│   ├── CustomerForm.tsx
│   ├── InvoiceBuilder.tsx
│   ├── WarehouseForm.tsx
│   ├── TransferForm.tsx
│   └── AdjustmentForm.tsx
├── components/
│   └── Layout.tsx        # Role-based navigation layout
├── utils/
│   ├── auth.ts           # Password hashing utilities
│   └── session.ts        # Session management
├── scripts/
│   ├── migrate.ts        # Database migration script
│   └── hash_password.ts  # Password hash generator
└── middleware.ts         # Authentication middleware
```

## Key Workflows

### Creating an Invoice
1. Navigate to Invoices → New Invoice
2. Select customer and warehouse
3. Add products with quantities and prices
4. Submit - stock is automatically decremented and kardex entries created

### Warehouse Transfer
1. Navigate to Transfers
2. Select source and destination warehouses
3. Add products and quantities
4. Submit to create pending transfer
5. Complete the transfer to update stock in both warehouses

### Inventory Adjustment
1. Navigate to Adjustments
2. Select warehouse, type (increase/decrease), and effective date
3. Add products with quantities and optional unit costs
4. Submit adjustment (status: PENDING)
5. Admin reviews and approves/rejects
6. Upon approval, stock and kardex are updated at the effective date

### Closing an Inventory Period
1. Admin navigates to Periods
2. Create a new period with start and end dates
3. Close the period when ready
4. All future stock-affecting operations will validate against closed periods

### Viewing Kardex
1. Navigate to Kardex
2. Enter product ID and warehouse ID
3. View complete transaction history with costs and balances

### Generating Valuation Report
1. Navigate to Valuation
2. Optionally select cutoff date and/or warehouse
3. Generate report to see inventory value using moving average cost

## Database Schema

The system uses the following main tables:

- `users` - User accounts with roles
- `products` - Product catalog
- `customers` - Customer information
- `warehouses` - Warehouse locations
- `stock` - Current stock levels per product/warehouse
- `stock_ledger` - Complete transaction history (kardex)
- `invoices` / `invoice_items` - Sales invoices
- `payments` - Invoice payments
- `warehouse_transfers` / `transfer_items` - Stock transfers
- `inventory_adjustments` / `adjustment_items` - Stock adjustments with approval
- `inventory_periods` - Accounting period controls

## Development

### Available Commands

```bash
deno task dev       # Start development server with hot reload
deno task start     # Start production server
deno task build     # Build for production
deno task migrate   # Run database migrations
deno task hash      # Generate password hash
deno task check     # Run linter and type checker
```

### Adding New Features

The application follows a layered architecture:
1. **Services Layer** (`services/`): Business logic and database operations
2. **API Routes** (`routes/api/`): REST endpoints that use services
3. **Pages** (`routes/`): Server-rendered pages
4. **Islands** (`islands/`): Interactive client-side components

## Security Features

- Passwords hashed with bcrypt
- HTTP-only cookies with SameSite=Lax
- Session-based authentication
- Role-based access control
- SQL injection prevention via parameterized queries
- CSRF protection via Fresh framework

## Production Deployment

For production deployment:

1. Set secure `SESSION_SECRET` in `.env`
2. Use strong database credentials
3. Configure reverse proxy (nginx/Caddy) with HTTPS
4. Set appropriate CORS policies
5. Enable rate limiting
6. Regular database backups
7. Monitor application logs

## License

[Your License Here]

## Support

For issues and questions, please open an issue on the GitHub repository.
