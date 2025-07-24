/**
 * Script de debug para verificar o problema com a listagem de movimentações
 */

const { sequelize } = require('./config/database');
const { Op } = require('sequelize');

async function debugMovimentacoes() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');
    
    // Verificar todas as movimentações
    const [movimentacoes] = await sequelize.query("SELECT * FROM Movimentacaos ORDER BY data DESC;");
    console.log('\n===== TODAS AS MOVIMENTAÇÕES =====');
    console.table(movimentacoes);
    
    // Testar filtros por mês
    console.log('\n===== TESTANDO FILTROS POR MÊS =====');
    
    // Array com os meses a testar
    const mesesParaTestar = [
      { mes: '02', ano: '2025', nome: 'Fevereiro' },
      { mes: '03', ano: '2025', nome: 'Março' },
      { mes: '04', ano: '2025', nome: 'Abril' }
    ];
    
    // Testar cada mês
    for (const { mes, ano, nome } of mesesParaTestar) {
      console.log(`\nTestando ${nome} (${mes}/${ano}):`);
      
      const dataInicio = new Date(`${ano}-${mes}-01`);
      const proxMes = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1;
      const proxAno = parseInt(mes) === 12 ? parseInt(ano) + 1 : parseInt(ano);
      const dataFim = new Date(`${proxAno}-${proxMes.toString().padStart(2, '0')}-01`);
      
      console.log(`Data início: ${dataInicio.toISOString()}`);
      console.log(`Data fim: ${dataFim.toISOString()}`);
      
      // Consultar com SQL
      const [resultadoSQL] = await sequelize.query(
        "SELECT * FROM Movimentacaos WHERE data >= ? AND data < ? ORDER BY data DESC;",
        { replacements: [dataInicio.toISOString().substring(0, 10), dataFim.toISOString().substring(0, 10)] }
      );
      
      console.log(`Movimentações encontradas via SQL: ${resultadoSQL.length}`);
      if (resultadoSQL.length > 0) {
        console.table(resultadoSQL);
      } else {
        console.log('Nenhuma movimentação encontrada');
      }
      
      // Verificar formato das datas no banco
      const [exemploDatas] = await sequelize.query("SELECT id, data, typeof(data) as tipo_data FROM Movimentacaos LIMIT 3;");
      console.log('\nFormato das datas no banco:');
      console.table(exemploDatas);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('Erro durante o debug:', error);
  }
}

debugMovimentacoes();
