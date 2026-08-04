const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean),
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// O corpo do webhook do Mercado Pago é lido como JSON normalmente — a
// autenticidade é garantida pela verificação de assinatura (x-signature),
// não pelo formato do corpo.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
