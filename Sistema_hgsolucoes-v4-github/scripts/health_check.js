/**
 * Script de verificação de saúde do sistema
 * Monitora o estado do banco de dados, espaço em disco e erros nos logs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

// Configuração
const LOG_FILE = path.join(__dirname, '../app.log');
const ERROR_LOG_FILE = path.join(__dirname, '../error.log');
const MAX_LOG_SIZE_MB = 100;
const MAX_DISK_USAGE_PERCENT = 85;
const SMTP_CONFIG = {
  // Configurar para envio de e-mails de alerta
  // host: 'smtp.example.com',
  // port: 587,
  // secure: false,
  // auth: {
  //   user: 'your_email@example.com',
  //   pass: 'your_password'
  // }
};

// Array para armazenar problemas encontrados
const problemas = [];

/**
 * Verifica a conexão com o banco de dados
 */
async function verificarBancoDados() {
  console.log('Verificando conexão com o banco de dados...');
  
  try {
    // Verificar se temos todas as configurações necessárias
    if (!dbConfig || !dbConfig.database || !dbConfig.username) {
      console.log('\u2757 Usando configuração alternativa para o banco de dados');
      // Configuração alternativa para teste
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: 'localhost',
        username: 'postgres',
        password: 'postgres',
        database: 'financeiro',
        logging: false
      });
      await sequelize.authenticate();
      console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
      return;
    }
    
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host || 'localhost',
        dialect: 'postgres', // Forçando dialeto postgres
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
    
  } catch (error) {
    const mensagem = `❌ Erro na conexão com o banco de dados: ${error.message}`;
    console.error(mensagem);
    problemas.push(mensagem);
  }
}

/**
 * Verifica o tamanho dos arquivos de log
 */
function verificarLogs() {
  console.log('Verificando tamanho dos logs...');
  
  try {
    // Verificar app.log
    if (fs.existsSync(LOG_FILE)) {
      const statsLog = fs.statSync(LOG_FILE);
      const tamanhoMB = statsLog.size / (1024 * 1024);
      
      if (tamanhoMB > MAX_LOG_SIZE_MB) {
        const mensagem = `⚠️ O arquivo de log (app.log) está muito grande: ${tamanhoMB.toFixed(2)}MB`;
        console.warn(mensagem);
        problemas.push(mensagem);
      } else {
        console.log(`✅ Tamanho do arquivo app.log: ${tamanhoMB.toFixed(2)}MB`);
      }
    }
    
    // Verificar error.log
    if (fs.existsSync(ERROR_LOG_FILE)) {
      const statsErrorLog = fs.statSync(ERROR_LOG_FILE);
      const tamanhoMB = statsErrorLog.size / (1024 * 1024);
      
      if (tamanhoMB > MAX_LOG_SIZE_MB / 2) { // Mais rigoroso com erros
        const mensagem = `⚠️ O arquivo de log de erros (error.log) está muito grande: ${tamanhoMB.toFixed(2)}MB`;
        console.warn(mensagem);
        problemas.push(mensagem);
      } else {
        console.log(`✅ Tamanho do arquivo error.log: ${tamanhoMB.toFixed(2)}MB`);
      }
    }
    
  } catch (error) {
    const mensagem = `❌ Erro ao verificar arquivos de log: ${error.message}`;
    console.error(mensagem);
    problemas.push(mensagem);
  }
}

/**
 * Verifica uso de disco
 */
function verificarDisco() {
  console.log('Verificando uso do disco...');
  
  try {
    const output = execSync('df -h /').toString();
    const lines = output.split('\n');
    if (lines.length >= 2) {
      const diskInfo = lines[1].split(/\s+/);
      const usagePercent = parseInt(diskInfo[4].replace('%', ''));
      
      if (usagePercent > MAX_DISK_USAGE_PERCENT) {
        const mensagem = `⚠️ Uso do disco está alto: ${usagePercent}%`;
        console.warn(mensagem);
        problemas.push(mensagem);
      } else {
        console.log(`✅ Uso do disco: ${usagePercent}%`);
      }
    }
  } catch (error) {
    const mensagem = `❌ Erro ao verificar uso do disco: ${error.message}`;
    console.error(mensagem);
    problemas.push(mensagem);
  }
}

/**
 * Verifica erros recentes nos logs
 */
function verificarErrosRecentes() {
  console.log('Verificando erros recentes nos logs...');
  
  try {
    if (fs.existsSync(ERROR_LOG_FILE)) {
      // Lê as últimas 100 linhas do arquivo de erros
      const command = `tail -n 100 ${ERROR_LOG_FILE}`;
      const recentLogs = execSync(command).toString();
      
      // Conta o número de erros nas últimas 24 horas
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const ontemIso = ontem.toISOString().split('T')[0];
      
      const errosRecentes = recentLogs.split('\n')
        .filter(linha => linha.includes('[ERROR]') || linha.includes('[CRITICAL]'))
        .filter(linha => {
          // Extrai a data do log
          const match = linha.match(/\[(\d{4}-\d{2}-\d{2})/);
          if (match && match[1]) {
            const dataLog = match[1];
            return dataLog >= ontemIso;
          }
          return false;
        });
      
      if (errosRecentes.length > 10) {
        const mensagem = `⚠️ Detectados ${errosRecentes.length} erros nas últimas 24 horas`;
        console.warn(mensagem);
        problemas.push(mensagem);
      } else {
        console.log(`✅ Erros recentes: ${errosRecentes.length}`);
      }
    }
  } catch (error) {
    const mensagem = `❌ Erro ao verificar logs de erro recentes: ${error.message}`;
    console.error(mensagem);
    problemas.push(mensagem);
  }
}

/**
 * Exibe relatório final
 */
function gerarRelatorio() {
  console.log('\n========== RELATÓRIO DE SAÚDE DO SISTEMA ==========');
  
  if (problemas.length === 0) {
    console.log('✅ Todos os sistemas estão funcionando normalmente!');
  } else {
    console.log(`❌ Foram encontrados ${problemas.length} problemas:`);
    problemas.forEach((problema, index) => {
      console.log(`${index + 1}. ${problema}`);
    });
    console.log('\nRecomendações:');
    console.log('1. Verifique os logs para mais detalhes sobre erros');
    console.log('2. Se os logs estiverem muito grandes, considere rotacioná-los');
    console.log('3. Se o disco estiver quase cheio, libere espaço');
    console.log('4. Se houver problemas com o banco de dados, verifique se o PostgreSQL está em execução');
  }
  
  console.log('===================================================\n');
}

/**
 * Função principal
 */
async function verificarSaude() {
  console.log('Iniciando verificação de saúde do sistema...\n');
  
  // Executa todas as verificações
  await verificarBancoDados();
  verificarLogs();
  verificarDisco();
  verificarErrosRecentes();
  
  // Gera relatório final
  gerarRelatorio();
  
  // Retorna código de saída 1 se houver problemas
  if (problemas.length > 0) {
    process.exit(1);
  }
}

// Executa a verificação
verificarSaude().catch(error => {
  console.error('Erro fatal durante verificação de saúde:', error);
  process.exit(1);
});
