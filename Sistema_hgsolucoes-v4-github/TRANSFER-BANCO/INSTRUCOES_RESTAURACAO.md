# Instruções para Restauração do Banco de Dados PostgreSQL
## Sistema HG Soluções v4

Este documento contém as instruções detalhadas para extrair e restaurar o backup do banco de dados PostgreSQL.

## Conteúdo do Backup

- **Nome do banco de dados**: sistema_hg_v3
- **Versão do PostgreSQL**: 15.13
- **Data do backup**: 24/07/2025
- **Arquivo SQL**: `sistema_hg_v3_backup.sql`
- **Arquivo compactado**: `sistema_hg_v3_backup.zip`

## Requisitos

1. PostgreSQL 15.x instalado (preferencialmente versão 15.13 ou compatível)
2. Acesso de administrador ao servidor PostgreSQL
3. Software de descompactação (para arquivos ZIP)

## Instruções para Extração e Restauração

### 1. Extração do Arquivo ZIP

```bash
# Extraia o conteúdo do arquivo ZIP
unzip sistema_hg_v3_backup.zip
```

Isso irá extrair o arquivo `sistema_hg_v3_backup.sql` para o diretório atual.

### 2. Criação do Banco de Dados (se não existir)

```bash
# Acesse o PostgreSQL
psql -U postgres

# Dentro do psql, crie o banco de dados se ele não existir
CREATE DATABASE sistema_hg_v3;

# Saia do psql
\q
```

### 3. Restauração do Banco de Dados

```bash
# Método 1: Usando psql
psql -U postgres -d sistema_hg_v3 -f sistema_hg_v3_backup.sql

# OU Método 2: Usando pg_restore (mais flexível)
pg_restore -U postgres -d sistema_hg_v3 --clean sistema_hg_v3_backup.sql
```

### 4. Verificação da Restauração

```bash
# Conecte ao banco para verificar
psql -U postgres -d sistema_hg_v3

# Dentro do psql, liste as tabelas para confirmar que o backup foi restaurado
\dt

# Verifique o número de registros em algumas tabelas principais
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM projetos;

# Saia do psql
\q
```

## Ajustes Pós-Restauração

### Configuração de Conexão

Após restaurar o banco de dados, certifique-se de atualizar as configurações de conexão no arquivo `config/database.js` do sistema:

```javascript
const { Sequelize } = require('sequelize');

// Configurando o Sequelize para usar PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',  // Atualize se o banco estiver em outro servidor
  port: 5432,         // Atualize se a porta for diferente
  database: 'sistema_hg_v3',
  username: 'seu_usuario',  // Substitua pelo usuário correto
  password: 'sua_senha',    // Substitua pela senha correta
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});
```

## Resolução de Problemas Comuns

1. **Erro de versão**: Se enfrentar erro de incompatibilidade de versão:
   ```
   pg_dump: error: server version: X.X; pg_dump version: Y.Y
   pg_dump: error: aborting because of server version mismatch
   ```
   Solução: Use a versão correta do pg_dump/pg_restore que corresponda à versão do servidor PostgreSQL.

2. **Erro de permissão**:
   ```
   ERROR: permission denied for relation [nome_tabela]
   ```
   Solução: Verifique se o usuário tem os privilégios necessários para as tabelas.

3. **Erro de codificação**:
   ```
   ERROR: encoding conversion error
   ```
   Solução: Verifique se a codificação do banco de dados de origem e destino são compatíveis.

## Importante

- Faça um backup do banco de dados de destino antes de executar a restauração, caso já existam dados nele
- Em ambientes de produção, recomenda-se testar o processo de restauração em um ambiente de teste primeiro
- O arquivo SQL contém todas as estruturas (tabelas, índices, funções) e dados do banco de dados

Para qualquer dúvida ou suporte adicional, entre em contato com a equipe técnica da HG Soluções.
