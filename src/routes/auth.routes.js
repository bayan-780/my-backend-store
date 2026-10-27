
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 1. مسار إنشاء حساب جديد (Register)
router.post('/register', async (req, res) => {
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

// 2. مسار تسجيل الدخول (Login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({
            message: 'تم تسجيل الدخول بنجاح', token, user: {
                id:

                    user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ', error: err.message });
    }
});

module.exports = router;
