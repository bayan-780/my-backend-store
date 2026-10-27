
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const app = express();

app.use(cors());
app.use(express.json());

// ربط مسارات فحص الحالة
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
// هذا السطر هو المهم جداً (تصدير التطبيق)
module.exports = app;
