import pool, { query } from "../db/client.ts";
import { validateOpenPeriod } from "./periodService.ts";

export interface Customer {
  id: number;
  code: string;
  name: string;
  identification?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  warehouse_id: number;
  invoice_date: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes?: string;
  created_by?: number;
  created_at: Date;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax: number;
  total: number;
}

// Customer CRUD
export async function getAllCustomers(): Promise<Customer[]> {
  const result = await query("SELECT * FROM customers WHERE active = true ORDER BY name");
  return result.rows as Customer[];
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const result = await query("SELECT * FROM customers WHERE id = $1", [id]);
  return result.rows[0] as Customer || null;
}

export async function createCustomer(data: {
  code: string;
  name: string;
  identification?: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<Customer> {
  const result = await query(
    "INSERT INTO customers (code, name, identification, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [data.code, data.name, data.identification || null, data.email || null, data.phone || null, data.address || null]
  );
  return result.rows[0] as Customer;
}

export async function updateCustomer(id: number, data: {
  code?: string;
  name?: string;
  identification?: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<Customer | null> {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (data.code !== undefined) {
    fields.push(`code = $${paramIndex++}`);
    values.push(data.code);
  }
  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.identification !== undefined) {
    fields.push(`identification = $${paramIndex++}`);
    values.push(data.identification);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.address !== undefined) {
    fields.push(`address = $${paramIndex++}`);
    values.push(data.address);
  }

  if (fields.length === 0) return await getCustomerById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE customers SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] as Customer || null;
}

export async function deleteCustomer(id: number): Promise<boolean> {
  const result = await query("UPDATE customers SET active = false WHERE id = $1", [id]);
  return result.rowCount !== undefined && result.rowCount > 0;
}

// Invoice operations
export async function getAllInvoices(): Promise<Invoice[]> {
  const result = await query(
    `SELECT i.*, c.name as customer_name, w.name as warehouse_name
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     JOIN warehouses w ON i.warehouse_id = w.id
     ORDER BY i.created_at DESC`
  );
  return result.rows as Invoice[];
}

export async function getInvoiceById(id: number) {
  const result = await query(
    `SELECT i.*, c.name as customer_name, w.name as warehouse_name
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     JOIN warehouses w ON i.warehouse_id = w.id
     WHERE i.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  
  const invoice = result.rows[0];
  
  const itemsResult = await query(
    `SELECT ii.*, p.code as product_code, p.name as product_name, p.unit
     FROM invoice_items ii
     JOIN products p ON ii.product_id = p.id
     WHERE ii.invoice_id = $1`,
    [id]
  );
  
  const paymentsResult = await query(
    "SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date",
    [id]
  );
  
  return {
    ...invoice,
    items: itemsResult.rows,
    payments: paymentsResult.rows
  };
}

export async function createInvoice(data: {
  customer_id: number;
  warehouse_id: number;
  invoice_date: Date;
  items: Array<{ 
    product_id: number; 
    quantity: number; 
    unit_price: number;
    tax?: number;
  }>;
  notes?: string;
  created_by: number;
}): Promise<Invoice> {
  // Validate period is open
  await validateOpenPeriod(data.invoice_date);

  const client = await pool.connect();
  
  try {
    await client.queryArray("BEGIN");

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    for (const item of data.items) {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemTax = item.tax || 0;
      subtotal += itemSubtotal;
      totalTax += itemTax;
    }

    const total = subtotal + totalTax;

    // Create invoice
    const invoiceResult = await client.queryObject(
      `INSERT INTO invoices 
       (invoice_number, customer_id, warehouse_id, invoice_date, subtotal, tax, total, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [invoiceNumber, data.customer_id, data.warehouse_id, data.invoice_date, subtotal, totalTax, total, data.notes || null, data.created_by]
    );

    const invoice = invoiceResult.rows[0] as Invoice;

    // Insert items and update stock
    for (const item of data.items) {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemTax = item.tax || 0;
      const itemTotal = itemSubtotal + itemTax;

      // Insert invoice item
      await client.queryObject(
        "INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, tax, total) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [invoice.id, item.product_id, item.quantity, item.unit_price, itemSubtotal, itemTax, itemTotal]
      );

      // Check stock availability
      const stockResult = await client.queryObject(
        "SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2",
        [item.product_id, data.warehouse_id]
      );

      const currentStock = stockResult.rows[0] 
        ? (stockResult.rows[0] as { quantity: number }).quantity
        : 0;

      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      // Decrement stock
      await client.queryObject(
        `INSERT INTO stock (product_id, warehouse_id, quantity)
         VALUES ($1, $2, -$3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = stock.quantity - $3`,
        [item.product_id, data.warehouse_id, item.quantity]
      );

      // Get average cost for ledger
      const avgCostResult = await client.queryObject(
        `SELECT 
          CASE 
            WHEN SUM(quantity) = 0 THEN 0
            ELSE SUM(value_change) / SUM(quantity)
          END as avg_cost
         FROM stock_ledger
         WHERE product_id = $1 AND warehouse_id = $2
         AND transaction_type IN ('purchase', 'adjustment_increase', 'transfer_in')`,
        [item.product_id, data.warehouse_id]
      );

      const avgCost = avgCostResult.rows[0] 
        ? (avgCostResult.rows[0] as { avg_cost: number | null }).avg_cost || 0
        : 0;

      // Record ledger entry
      await client.queryObject(
        `INSERT INTO stock_ledger 
         (product_id, warehouse_id, transaction_type, transaction_date, reference_type, reference_id,
          quantity, unit_cost, value_change, balance_quantity)
         VALUES ($1, $2, 'sale', $3, 'invoice', $4, -$5, $6, -$7,
          (SELECT COALESCE(quantity, 0) FROM stock WHERE product_id = $1 AND warehouse_id = $2))`,
        [item.product_id, data.warehouse_id, data.invoice_date, invoice.id, 
         item.quantity, avgCost, item.quantity * avgCost]
      );
    }

    await client.queryArray("COMMIT");
    return invoice;
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function addPayment(data: {
  invoice_id: number;
  payment_date: Date;
  amount: number;
  payment_method: string;
  reference?: string;
  notes?: string;
}) {
  const result = await query(
    "INSERT INTO payments (invoice_id, payment_date, amount, payment_method, reference, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [data.invoice_id, data.payment_date, data.amount, data.payment_method, data.reference || null, data.notes || null]
  );
  return result.rows[0];
}
