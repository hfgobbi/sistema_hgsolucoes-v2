/**
 * Script para corrigir o saldo do usuário no banco de dados
 */

const { sequelize } = require('./config/database');
const { Sequelize } = require('sequelize');

async function corrigirSaldo() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    
    console.log('Corrigindo saldo de todos os usuários...');
    
    // 1. Força a atualização do saldo para ZERO usando SQL direto
    await sequelize.query("UPDATE Usuarios SET saldo = 0;");
    
    // 2. Recalcula o saldo com base nas movimentações (caso existam)
    const [usuarios] = await sequelize.query("SELECT id FROM Usuarios;");
    
    console.log(`Encontrados ${usuarios.length} usuários para atualizar`);
    
    for (const usuario of usuarios) {
      const userId = usuario.id;
      
      // Obter soma das entradas
      const [entradas] = await sequelize.query(
        "SELECT COALESCE(SUM(valor), 0) as total FROM Movimentacaos WHERE usuario_id = :userId AND tipo = 'entrada'", 
        { replacements: { userId } }
      );
      
      // Obter soma das saídas
      const [saidas] = await sequelize.query(
        "SELECT COALESCE(SUM(valor), 0) as total FROM Movimentacaos WHERE usuario_id = :userId AND tipo = 'saida'", 
        { replacements: { userId } }
      );
      
      // Calcular saldo
      const totalEntradas = parseFloat(entradas[0].total) || 0;
      const totalSaidas = parseFloat(saidas[0].total) || 0;
      const saldoFinal = totalEntradas - totalSaidas;
      
      // Atualizar saldo do usuário
      await sequelize.query(
        "UPDATE Usuarios SET saldo = :saldo, data_atualizacao = datetime('now') WHERE id = :userId",
        { replacements: { saldo: saldoFinal, userId } }
      );
      
      console.log(`Usuário ID ${userId}: Saldo atualizado para ${saldoFinal}`);
    }
    
    // Verificar resultado final
    const [result] = await sequelize.query("SELECT id, login, saldo FROM Usuarios;");
    console.log('\nResultado final:');
    console.table(result);
    
    console.log('\n✅ Saldos corrigidos com sucesso!');
    console.log('Recomendação: Reinicie o servidor e limpe o cache do navegador');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir saldos:', error);
    process.exit(1);
  }
}

// Executar a função
corrigirSaldo();
