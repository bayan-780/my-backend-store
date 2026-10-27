
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 1. إنشاء متجر جديد (POST /stores)
exports.createStore = async (req, res) => {
  const { name, description, logo } = req.body;
  const ownerId = req.user.id; // سنأخذ معرف المالك من التوكن (سيأتي من الـ middleware)

  try {
    const newStore = await pool.query(
      "INSERT INTO stores (owner_id, name, description, logo, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
      [ownerId, name, description, logo]
    );
    res.status(201).json({ message: 'تم إنشاء المتجر بنجاح، وهو بانتظار الموافقة', store: newStore.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
};


// 2. جلب كل المتاجر النشطة (GET /stores)
exports.getStores = async (req, res) => {
  try {
    const stores = await pool.query("SELECT * FROM stores WHERE status = 'active'");
    res.json(stores.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
};

// 3. جلب متجر واحد بالمعرف (GET /stores/:id)
exports.getStoreById = async (req, res) => {
  const { id } = req.params;
  try {
    const store = await pool.query("SELECT * FROM stores WHERE id = $1", [id]);
    if (store.rows.length === 0) return res.status(404).json({ message: 'المتجر غير موجود' });
    res.json(store.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
};

// 4. جلب المتاجر المميزة (GET /stores/featured)
exports.getFeaturedStores = async (req, res) => {

  try {
    // كمثال: نأتي بالمتاجر التي تقييمها أعلى من 4
    const stores = await pool.query("SELECT * FROM stores WHERE status = 'active' AND rating >= 4");
    res.json(stores.rows);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err.message });
  }
};
