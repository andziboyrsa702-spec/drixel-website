const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Enable CORS for all origins (adjust for production)
app.use(cors({
  origin: '*', // In production, replace with your domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ YOUR REAL YOCO LIVE SECRET KEY
const YOCO_SECRET_KEY = "sk_live_8c81ca98GV81kVOa06b4756a4d41";
const YOCO_API_URL = "https://payments.yoco.com/api/v1/charges";

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Drixel SA Yoco Payment Gateway',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    live: true,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test: '/api/test',
      processPayment: '/api/process-payment'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'yoco-payment-gateway',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'Yoco LIVE Payment Server Running',
    merchant: 'Drixel SA',
    timestamp: new Date().toISOString(),
    keys: {
      publicKey: 'pk_live_f26b158aDmMkbm56f1c4',
      hasSecretKey: true,
      environment: 'LIVE'
    },
    message: 'Server is ready to process payments'
  });
});

// Process REAL payment endpoint
app.post('/api/process-payment', async (req, res) => {
  try {
    const { token, amount, currency, email, metadata } = req.body;
    
    console.log("=".repeat(50));
    console.log("💳 RECEIVED PAYMENT REQUEST");
    console.log("=".repeat(50));
    console.log("📧 Customer Email:", email);
    console.log("💰 Amount:", (amount / 100).toFixed(2), "ZAR");
    console.log("🆔 Token:", token.substring(0, 20) + '...');
    console.log("📦 Metadata:", metadata);
    
    // Validate input
    if (!token || !amount || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, amount, or email'
      });
    }
    
    // Call REAL Yoco LIVE API
    console.log("🔄 Calling Yoco LIVE API...");
    const response = await axios.post(YOCO_API_URL, {
      token: token,
      amountInCents: amount,
      currency: currency || 'ZAR',
      customer: {
        email: email
      },
      metadata: metadata || {}
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log("✅ Yoco LIVE Payment Successful!");
    console.log("🔑 Charge ID:", response.data.id);
    console.log("💵 Amount Charged:", (response.data.amountInCents / 100).toFixed(2), "ZAR");
    console.log("📊 Status:", response.data.status);
    console.log("=".repeat(50));
    
    res.json({
      success: true,
      chargeId: response.data.id,
      amount: response.data.amountInCents / 100,
      currency: response.data.currency,
      status: response.data.status,
      message: 'Payment processed successfully via Yoco LIVE',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Yoco LIVE Payment Failed!");
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data);
    console.error("Error Message:", error.message);
    console.log("=".repeat(50));
    
    let errorMessage = 'Payment processing failed';
    let errorCode = 'payment_failed';
    
    if (error.response?.data?.errorMessage) {
      errorMessage = error.response.data.errorMessage;
      errorCode = error.response.data.errorType || 'payment_failed';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Payment timeout. Please try again.';
      errorCode = 'timeout';
    } else if (error.message.includes('Network')) {
      errorMessage = 'Network error. Please check your connection.';
      errorCode = 'network_error';
    }
    
    // User-friendly error messages
    if (errorMessage.includes('insufficient')) {
      errorMessage = 'Insufficient funds. Please use a different card.';
    } else if (errorMessage.includes('declined')) {
      errorMessage = 'Card declined. Please contact your bank or use a different card.';
    } else if (errorMessage.includes('expired')) {
      errorMessage = 'Card has expired. Please use a different card.';
    } else if (errorMessage.includes('Invalid card')) {
      errorMessage = 'Invalid card details. Please check your information.';
    } else if (errorMessage.includes('Invalid token')) {
      errorMessage = 'Payment token invalid. Please try again.';
    }
    
    res.status(error.response?.status || 400).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 DRIXEL SA YOCO LIVE PAYMENT GATEWAY');
  console.log('='.repeat(60));
  console.log('✅ Server running on port', PORT);
  console.log('✅ Environment:', process.env.NODE_ENV || 'development');
  console.log('✅ Yoco Keys: LIVE PRODUCTION');
  console.log('✅ Public Key: pk_live_f26b158aDmMkbm56f1c4');
  console.log('✅ Health Check:', `http://localhost:${PORT}/health`);
  console.log('✅ Test Endpoint:', `http://localhost:${PORT}/api/test`);
  console.log('✅ Payment Endpoint:', `http://localhost:${PORT}/api/process-payment`);
  console.log('='.repeat(60));
});
