const express = require('express');
const { createPolicy, getPoliciesByUser } = require('../controllers/policyController');

const router = express.Router();

router.post('/create', createPolicy);
router.get('/', getPoliciesByUser);

module.exports = router;
