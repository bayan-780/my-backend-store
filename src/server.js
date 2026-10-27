
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ==========================================
// 1. مسارات المصادقة (Auth)
// ==========================================
app.post('/api/v1/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'البريد مسجل مسبقاً' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'customer']
    );
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

    const token = jwt.sign({ id: user.rows[0].id, role: 

user.rows[0].role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ message: 'تم تسجيل الدخول بنجاح', token, user: { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role } });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

// ==========================================
// 2. مسارات المتاجر (Stores)
// ==========================================
app.post('/api/v1/stores', async (req, res) => {
  const { name, description, logo } = req.body;
  try {
    const newStore = await pool.query(
      "INSERT INTO stores (name, description, logo, status) VALUES ($1, $2, $3, 'pending') RETURNING *",
      [name, description, logo]
    );
    res.status(201).json({ message: 'تم إنشاء المتجر بنجاح، وهو بانتظار الموافقة', store: newStore.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

app.get('/api/v1/stores', async (req, res) => {
  try {
    const stores = await pool.query("SELECT * FROM stores WHERE status = 'active'");
    res.json(stores.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

// ==========================================
// 3. مسارات المنتجات (Products)
// ==========================================
app.post('/api/v1/stores/:storeId/products', async (req, res) => {
  const { storeId } = req.params;
  const { name, description, price, stock, category } = req.body;
  try {
    const newProduct = await pool.query(
      "INSERT INTO products (store_id, name, description, price, stock, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [storeId, name, description, price, stock, category]
    );
    res.status(201).json({ message: 'تم إضافة المنتج بنجاح', product: newProduct.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });

  }
});

app.get('/api/v1/products', async (req, res) => {
  try {
    const products = await pool.query("SELECT * FROM products");
    res.json(products.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

// ==========================================
// 4. مسارات الطلبات (Orders)
// ==========================================
app.post('/api/v1/orders', async (req, res) => {
  const { storeId, customerName, customerPhone, customerAddress, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    for (const item of items) {
      const productRes = await client.query('SELECT * FROM products WHERE id = $1 AND store_id = $2 FOR UPDATE', [item.productId, storeId]);
      if (productRes.rows.length === 0) throw new Error('المنتج غير موجود');

      const product = productRes.rows[0];
      if (product.stock < item.quantity) throw new Error(`الكمية غير متوفرة للمنتج: ${product.name}`);
      total += product.price * item.quantity;
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, product.id]);
    }
    const orderNumber = 'ORD-' + Date.now();
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, store_id, customer_name, customer_phone, customer_address, total) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [orderNumber, storeId, customerName, customerPhone, customerAddress, total]
    );
    await client.query('COMMIT');
    res.status(201).json({ message: 'تم إنشاء الطلب بنجاح', orderId: orderRes.rows[0].id, total });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 5. مسارات المدير (Admin)
// ==========================================
app.get('/api/v1/admin/users', async (req, res) => {

  try {
    const users = await pool.query('SELECT id, name, email, role FROM users');
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

app.get('/api/v1/admin/stores', async (req, res) => {
  try {
    const stores = await pool.query('SELECT * FROM stores');
    res.json(stores.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});


app.patch('/api/v1/products/:id', async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const updated = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *',
      [name, price, stock, req.params.id]
    );
    res.json({ message: 'تم تعديل المنتج', product: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

app.delete('/api/v1/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم حذف المنتج' });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

app.get('/api/v1/admin/orders', async (req, res) => {
  try {
    const orders = await pool.query('SELECT * FROM orders');
    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});

app.patch('/api/v1/stores/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await pool.query(
      'UPDATE stores SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json({ message: 'تم تحديث حالة المتجر', store: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
});


// ==========================================
// 6. تشغيل الخادم
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
