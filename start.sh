#!/bin/bash

# =================================================================
#  Sistema de Controle Financeiro - PostgreSQL Edition
#  Porta: 8000
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
DB_NAME="controle_financeiro"

# Função para mostrar banner
show_banner() {
  echo -e "${CIANO}╔═════════════════════════════════════════════════════╗${SEM_COR}"
  echo -e "${CIANO}║                                                     ║${SEM_COR}"
  echo -e "${CIANO}║  ${NEGRITO}${MAGENTA}SISTEMA DE CONTROLE FINANCEIRO${SEM_COR}${CIANO}                  ║${SEM_COR}"
  echo -e "${CIANO}║  ${AZUL}PostgreSQL Edition${SEM_COR}${CIANO}                              ║${SEM_COR}"
  echo -e "${CIANO}║                                                     ║${SEM_COR}"
  echo -e "${CIANO}╚═════════════════════════════════════════════════════╝${SEM_COR}"
  echo -e "${VERDE}Porta:${SEM_COR} $PORT | ${VERDE}Log:${SEM_COR} $LOG_FILE | ${VERDE}PID:${SEM_COR} $PID_FILE"
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

# Função para iniciar o PostgreSQL
start_postgres() {
  if ! check_postgres; then
    echo -e "${AMARELO}PostgreSQL não está rodando. Tentando iniciar...${SEM_COR}"
    
    # Diferentes comandos para iniciar PostgreSQL dependendo da distribuição
    if [ -f /etc/init.d/postgresql ]; then
      echo -e "${VERDE}Iniciando PostgreSQL via init.d...${SEM_COR}"
      sudo /etc/init.d/postgresql start
    elif command -v systemctl &> /dev/null; then
      # Detectar versão do PostgreSQL para systemd
      local pg_services=$(systemctl list-unit-files | grep postgresql | awk '{print $1}')
      
      if [ -n "$pg_services" ]; then
        # Pega o primeiro serviço PostgreSQL disponível
        local pg_service=$(echo "$pg_services" | head -n 1)
        echo -e "${VERDE}Iniciando PostgreSQL via systemd ($pg_service)...${SEM_COR}"
        sudo systemctl start "$pg_service"
      else
        echo -e "${VERDE}Iniciando PostgreSQL via systemd (serviço genérico)...${SEM_COR}"
        sudo systemctl start postgresql
      fi
    else
      echo -e "${VERMELHO}Não foi possível iniciar o PostgreSQL automaticamente.${SEM_COR}"
      echo -e "${AMARELO}Por favor, inicie o PostgreSQL manualmente e tente novamente.${SEM_COR}"
      return 1
    fi
    
    # Aguarde o PostgreSQL iniciar com feedback visual
    echo -e "${AMARELO}Aguardando PostgreSQL iniciar.${SEM_COR}"
    for i in {1..10}; do
      echo -n "."
      if check_postgres; then
        echo -e "\n${VERDE}PostgreSQL iniciado com sucesso!${SEM_COR}"
        break
      fi
      sleep 1
      
      # Se após 10 tentativas ainda não iniciar, falha
      if [ $i -eq 10 ] && ! check_postgres; then
        echo -e "\n${VERMELHO}Falha ao iniciar o PostgreSQL após 10 tentativas.${SEM_COR}"
        return 1
      fi
    done
  fi
  
  echo -e "${VERDE}✓ PostgreSQL está rodando e pronto.${SEM_COR}"
  return 0
}



# Função para instalar dependências necessárias
install_dependencies() {
  cd "$APP_DIR" || exit 1
  
  # Verificar se as dependências estão instaladas
  if [ ! -d "node_modules" ]; then
    echo -e "${AMARELO}Instalando dependências...${SEM_COR}"
    npm install
    
    # Verificar se a instalação foi bem sucedida
    if [ $? -ne 0 ]; then
      echo -e "${VERMELHO}Erro ao instalar dependências.${SEM_COR}" >&2
      exit 1
    else
      echo -e "${VERDE}✓ Dependências instaladas com sucesso.${SEM_COR}"
    fi
  else
    echo -e "${VERDE}✓ Dependências já estão instaladas.${SEM_COR}"
  fi
}

# Função para iniciar a aplicação
start_app() {
  cd "$APP_DIR" || exit 1
  
  show_banner
  echo -e "${VERDE}Iniciando Sistema de Controle Financeiro com PostgreSQL...${SEM_COR}"
  
  # Verificar se o Node.js está instalado
  if ! [ -x "$(command -v node)" ]; then
    echo -e "${VERMELHO}Erro: Node.js não está instalado. Por favor, instale o Node.js antes de executar esta aplicação.${SEM_COR}" >&2
    exit 1
  fi
  
  # Verificar se o PostgreSQL está rodando
  if ! start_postgres; then
    echo -e "${VERMELHO}Não foi possível iniciar a aplicação sem o PostgreSQL.${SEM_COR}"
    exit 1
  fi
  
  echo -e "${VERDE}Utilizando o banco de dados PostgreSQL existente...${SEM_COR}"
  
  # Instalar dependências se necessário
  install_dependencies
  
  # Verificar se a aplicação já está rodando
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${AMARELO}A aplicação já está rodando (PID: $PID).${SEM_COR}"
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
  else
    # Iniciar o servidor normalmente
    echo -e "${VERDE}Iniciando o servidor na porta $PORT...${SEM_COR}"
    echo -e "${AZUL}Acesse a aplicação em: http://localhost:$PORT${SEM_COR}"
    echo -e "${AZUL}Credenciais de admin: login: admin / senha: admin123${SEM_COR}"
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
      echo -e "${AMARELO}Servidor não está rodando.${SEM_COR}"
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
      echo -e "${AZUL}Acesse a aplicação em: http://localhost:$PORT${SEM_COR}"
      return 0
    else
      echo -e "${AMARELO}Servidor não está rodando (arquivo PID inválido)${SEM_COR}"
      rm "$PID_FILE"
      return 1
    fi
  else
    echo -e "${AMARELO}Servidor não está rodando${SEM_COR}"
    return 1
  fi
}

# Processar argumentos da linha de comando
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
