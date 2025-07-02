/**
 * Script para limpar todos os dados do banco de dados SQLite
 */

const { sequelize } = require('./config/database');

async function limparBancoDados() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    
    console.log('Limpando todos os dados...');
    
    // Usa SQL puro para truncar todas as tabelas importantes
    // A ordem é importante devido às restrições de chave estrangeira
    await sequelize.query("DELETE FROM Movimentacaos;");
    await sequelize.query("DELETE FROM Categoria;");
    await sequelize.query("UPDATE Usuarios SET saldo = 0 WHERE login = 'admin';");
    
    // Resetar sequências de auto-incremento (se aplicável)
    await sequelize.query("DELETE FROM sqlite_sequence WHERE name IN ('Movimentacaos', 'Categoria');");
    
    console.log('✅ Banco de dados limpo com sucesso!');
    console.log('✅ Todos os dados foram removidos, exceto o usuário admin');
    console.log('✅ O saldo do usuário admin foi definido como R$ 0,00');
    
    // Fechar a conexão
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao limpar o banco de dados:', error);
    process.exit(1);
  }
}

// Executar a função
limparBancoDados();
