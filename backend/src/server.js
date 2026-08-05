require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');
const { scheduleExpireReservationsJob } = require('./jobs/expireReservations');

const PORT = process.env.PORT || 3000;

// Detecta credenciais ausentes ou ainda com o valor de exemplo do .env.example
// — evita que o primeiro sinal do problema seja um cliente falhando o pagamento.
function warnAboutMissingMercadoPagoCredentials() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY || '';
  const looksLikePlaceholder = (v) => !v || v.includes('xxxxxxxx') || v.includes('TEST-xxx');

  if (looksLikePlaceholder(token) || looksLikePlaceholder(publicKey)) {
    // eslint-disable-next-line no-console
    console.warn(
      '\n[aviso] MERCADOPAGO_ACCESS_TOKEN e/ou MERCADOPAGO_PUBLIC_KEY não parecem configurados no .env ' +
      '(ainda com o valor de exemplo, ou vazios).\n' +
      'Pagamentos por cartão e Pix vão falhar com 502 até você colocar credenciais reais de sandbox, ' +
      'obtidas em https://www.mercadopago.com.br/developers/panel — lembre de reiniciar o servidor depois de editar o .env.\n'
    );
  }
}

async function start() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log('[db] conexão com o banco de dados estabelecida');

    warnAboutMissingMercadoPagoCredentials();
    scheduleExpireReservationsJob();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] Dravennx API rodando na porta ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] falha ao iniciar a aplicação:', err);
    process.exit(1);
  }
}

start();
