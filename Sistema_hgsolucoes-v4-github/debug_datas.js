const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuração do PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  username: 'postgres',
  password: 'postgres',
  logging: false,
  // IMPORTANTE: Desabilitar conversão de timezone para testar
  timezone: '+00:00'
});

// Teste para entender como o PostgreSQL está tratando as datas
async function testarDatas() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco estabelecida!');
    
    // Criar uma tabela temporária para testes
    const TesteDatas = sequelize.define('TesteDatas', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      data_string: DataTypes.STRING,
      data_date: DataTypes.DATE,
      data_dateonly: DataTypes.DATEONLY,
      descricao: DataTypes.STRING
    }, {
      tableName: 'teste_datas',
      timestamps: false
    });
    
    // Sincronizar o modelo (criar a tabela)
    await TesteDatas.sync({ force: true });
    console.log('Tabela de teste criada!');
    
    // Data de teste: 30 de junho de 2025
    const dataJunho = '2025-06-30';
    console.log(`\n=== TESTE COM DATA: ${dataJunho} ===`);
    
    // Inserir um registro usando a data como string
    const teste1 = await TesteDatas.create({
      data_string: dataJunho,
      data_date: dataJunho,
      data_dateonly: dataJunho,
      descricao: 'Teste de data 30/06/2025'
    });
    
    // Consultar o registro diretamente no PostgreSQL
    const [resultados] = await sequelize.query(`
      SELECT 
        id,
        data_string, 
        data_date,
        data_dateonly,
        descricao,
        pg_typeof(data_string) as tipo_string,
        pg_typeof(data_date) as tipo_date,
        pg_typeof(data_dateonly) as tipo_dateonly
      FROM teste_datas
    `);
    
    console.log('\nRegistro no banco:');
    console.log(JSON.stringify(resultados, null, 2));
    
    // Recuperar o registro usando Sequelize
    const registroDb = await TesteDatas.findByPk(teste1.id);
    console.log('\nRegistro recuperado via Sequelize:');
    console.log(registroDb.toJSON());
    
    // Teste de inserção direta via SQL
    await sequelize.query(`
      INSERT INTO teste_datas (data_string, data_date, data_dateonly, descricao)
      VALUES ('2025-06-30', '2025-06-30', '2025-06-30', 'Inserido via SQL')
    `);
    
    // Testar como o Sequelize está tratando as datas
    const hoje = new Date();
    const dadosHoje = {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth() + 1,
      dia: hoje.getDate(),
      hora: hoje.getHours(),
      timezone: hoje.getTimezoneOffset() / -60
    };
    
    console.log('\nData atual no sistema:');
    console.log(`Data completa: ${hoje.toISOString()}`);
    console.log(`Data local: ${hoje.toLocaleDateString()}`);
    console.log(`Componentes: ${JSON.stringify(dadosHoje)}`);
    console.log(`Timezone offset: ${hoje.getTimezoneOffset() / -60}h`);
    
    // Limpar a tabela de teste no final
    await TesteDatas.drop();
    console.log('\nTabela de teste removida!');

  } catch (error) {
    console.error('Erro durante os testes:', error);
  } finally {
    await sequelize.close();
  }
}

testarDatas();
