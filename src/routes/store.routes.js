
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// مسارات المتاجر
router.get('/', storeController.getStores);
router.get('/featured', storeController.getFeaturedStores);
router.get('/:id', storeController.getStoreById);

// مسار إنشاء متجر (يجب أن يكون المستخدم مسجلاً للدخول)
router.post('/', verifyToken, storeController.createStore);

module.exports = router;
