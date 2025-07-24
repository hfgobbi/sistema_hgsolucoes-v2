# Backup do Sistema HG Soluções V4

Este diretório contém backups do sistema HG Soluções V4 e seu banco de dados PostgreSQL.

## Conteúdo dos backups

1. **Backup do sistema:** `sistema_hgsolucoes-v4_*.tar.gz`
   - Contém todos os arquivos do código-fonte do sistema
   - Exclui node_modules, .git e a pasta backup
   
2. **Backup do banco de dados:** `sistema_hg_v3_*.sql`
   - Dump completo do banco de dados PostgreSQL `sistema_hg_v3`
   - Contém todas as tabelas, dados, funções e estruturas

## Como restaurar

### Restaurando o código-fonte:

```bash
tar -xzf sistema_hgsolucoes-v4_*.tar.gz -C /caminho/para/destino
```

### Restaurando o banco de dados:

```bash
psql -U herculesgobbi -d sistema_hg_v3 -f sistema_hg_v3_*.sql
```
Ou para criar um novo banco:
```bash
createdb -U herculesgobbi sistema_hg_v3_novo
psql -U herculesgobbi -d sistema_hg_v3_novo -f sistema_hg_v3_*.sql
```

## Data do backup

Backup realizado em: 16 de Julho de 2025
