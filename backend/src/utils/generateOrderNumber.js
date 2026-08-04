// Gera números no formato BOS-AAAA-000123, usando uma sequence dedicada do
// Postgres (order_number_seq) para evitar corrida entre pedidos simultâneos.
function formatOrderNumber(year, sequence) {
  return `BOS-${year}-${String(sequence).padStart(6, '0')}`;
}

async function nextOrderNumber(sequelize) {
  const [[row]] = await sequelize.query("SELECT nextval('order_number_seq') AS seq;");
  const year = new Date().getFullYear();
  return formatOrderNumber(year, row.seq);
}

module.exports = { formatOrderNumber, nextOrderNumber };
