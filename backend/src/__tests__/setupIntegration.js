require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'segredo-refresh-de-teste';
process.env.MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'segredo-webhook-teste';
process.env.SMTP_HOST = ''; // evita qualquer tentativa real de conexão SMTP nos testes
