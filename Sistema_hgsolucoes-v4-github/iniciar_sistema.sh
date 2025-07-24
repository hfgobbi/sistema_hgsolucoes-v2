#!/bin/bash

# =================================================================
#  Sistema HG Soluções V4 - PostgreSQL Edition
#  Porta: 8000
#  Banco: sistema_hg_v3
#  Data: $(date +"%d/%m/%Y")
# =================================================================

# Cores para terminal
VERDE="\033[0;32m"
AZUL="\033[0;34m"
AMARELO="\033[1;33m"
VERMELHO="\033[0;31m"
MAGENTA="\033[0;35m"
CIANO="\033[0;36m"
NEGRITO="\033[1m"
SEM_COR="\033[0m"

# Configurações da aplicação
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/.app.pid"
LOG_FILE="$APP_DIR/app.log"
PORT=8000
DB_NAME="sistema_hg_v3"

# Função para mostrar banner
show_banner() {
  echo -e "${CIANO}╔═════════════════════════════════════════════════════╗${SEM_COR}"
  echo -e "${CIANO}║                                                     ║${SEM_COR}"
  echo -e "${CIANO}║  ${NEGRITO}${MAGENTA}SISTEMA HG SOLUÇÕES V4${SEM_COR}${CIANO}                      ║${SEM_COR}"
  echo -e "${CIANO}║  ${AZUL}PostgreSQL Edition${SEM_COR}${CIANO}                              ║${SEM_COR}"
  echo -e "${CIANO}║                                                     ║${SEM_COR}"
  echo -e "${CIANO}╚═════════════════════════════════════════════════════╝${SEM_COR}"
  echo -e "${VERDE}Porta:${SEM_COR} $PORT | ${VERDE}Log:${SEM_COR} $LOG_FILE | ${VERDE}PID:${SEM_COR} $PID_FILE"
  echo -e "${VERDE}Banco:${SEM_COR} $DB_NAME"
  echo
}

# Função para verificar se o PostgreSQL está em execução
check_postgres() {
  if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
      return 0  # PostgreSQL está rodando
    else
      return 1  # PostgreSQL não está rodando
    fi
  else
    # Se pg_isready não estiver disponível, tenta com ps
    if ps aux | grep -v grep | grep postgres > /dev/null; then
      return 0  # PostgreSQL está rodando
    else
      return 1  # PostgreSQL não está rodando
    fi
  fi
}

# Função para instalar dependências se necessário
install_dependencies() {
  if [ ! -d "$APP_DIR/node_modules" ]; then
    echo -e "${AMARELO}Instalando dependências do Node.js...${SEM_COR}"
    npm install --no-audit --no-fund
  fi
}

# Função para iniciar a aplicação
start_app() {
  cd "$APP_DIR" || exit 1
  
  show_banner
  echo -e "${VERDE}Iniciando Sistema HG Soluções V4...${SEM_COR}"
  
  # Verificar se o Node.js está instalado
  if ! [ -x "$(command -v node)" ]; then
    echo -e "${VERMELHO}Erro: Node.js não está instalado. Por favor, instale o Node.js antes de executar esta aplicação.${SEM_COR}" >&2
    exit 1
  fi
  
  # Verificar se o PostgreSQL está rodando
  if ! check_postgres; then
    echo -e "${VERMELHO}PostgreSQL não está rodando. Não é possível iniciar o sistema.${SEM_COR}"
    echo -e "${AMARELO}Por favor, inicie o PostgreSQL manualmente e tente novamente.${SEM_COR}"
    exit 1
  fi
  
  echo -e "${VERDE}PostgreSQL detectado e funcionando.${SEM_COR}"
  echo -e "${VERDE}Utilizando o banco de dados '$DB_NAME'...${SEM_COR}"
  
  # Instalar dependências se necessário
  install_dependencies
  
  # Verificar se a aplicação já está rodando
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${AMARELO}O sistema já está rodando (PID: $PID).${SEM_COR}"
      echo -e "${AZUL}Acesse em: http://localhost:$PORT${SEM_COR}"
      return 0
    else
      # Remove arquivo PID inválido
      rm "$PID_FILE"
    fi
  fi
  
  # Modo daemon (em background)
  if [ "$1" == "daemon" ]; then
    echo -e "${VERDE}Iniciando servidor em segundo plano na porta $PORT...${SEM_COR}"
    PORT=$PORT nohup node index.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo -e "${VERDE}Servidor iniciado em segundo plano (PID: $(cat "$PID_FILE"))${SEM_COR}"
    echo -e "${AZUL}Acesse em: http://localhost:$PORT${SEM_COR}"
    echo -e "${AZUL}Credenciais: login: admin / senha: admin123${SEM_COR}"
  else
    # Iniciar o servidor normalmente
    echo -e "${VERDE}Iniciando o servidor na porta $PORT...${SEM_COR}"
    echo -e "${AZUL}Acesse em: http://localhost:$PORT${SEM_COR}"
    echo -e "${AZUL}Credenciais: login: admin / senha: admin123${SEM_COR}"
    echo -e "${AMARELO}Pressione Ctrl+C para parar o servidor${SEM_COR}"
    PORT=$PORT node index.js
  fi
}

# Função para parar a aplicação
stop_app() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${AMARELO}Parando servidor (PID: $PID)...${SEM_COR}"
      kill "$PID"
      rm "$PID_FILE"
      echo -e "${VERDE}Servidor parado com sucesso.${SEM_COR}"
    else
      echo -e "${AMARELO}Servidor não está rodando (PID inválido).${SEM_COR}"
      rm "$PID_FILE"
    fi
  else
    echo -e "${AMARELO}Servidor não está rodando.${SEM_COR}"
  fi
}

# Função para reiniciar a aplicação
restart_app() {
  stop_app
  sleep 2
  start_app "$1"
}

# Função para verificar status da aplicação
status_app() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${VERDE}Servidor está rodando (PID: $PID)${SEM_COR}"
      echo -e "${AZUL}Acesse em: http://localhost:$PORT${SEM_COR}"
      return 0
    else
      echo -e "${AMARELO}Servidor não está rodando (PID inválido).${SEM_COR}"
      rm "$PID_FILE"
      return 1
    fi
  else
    echo -e "${AMARELO}Servidor não está rodando.${SEM_COR}"
    return 1
  fi
}

# Tratar parâmetros
case "$1" in
  start)
    start_app
    ;;
  daemon)
    start_app "daemon"
    ;;
  stop)
    stop_app
    ;;
  restart)
    restart_app
    ;;
  status)
    status_app
    ;;
  *)
    show_banner
    echo -e "${NEGRITO}COMANDOS DISPONÍVEIS:${SEM_COR}"
    echo -e "  ${VERDE}start${SEM_COR}     - Inicia o servidor no terminal (modo interativo)"
    echo -e "  ${VERDE}daemon${SEM_COR}    - Inicia o servidor em segundo plano"
    echo -e "  ${VERDE}stop${SEM_COR}      - Para o servidor"
    echo -e "  ${VERDE}restart${SEM_COR}   - Reinicia o servidor"
    echo -e "  ${VERDE}status${SEM_COR}    - Verifica o status do servidor"
    echo 
    echo -e "${AZUL}Acesso:${SEM_COR} http://localhost:$PORT"
    exit 1
    ;;
esac

exit 0
