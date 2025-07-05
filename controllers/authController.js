const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models/Usuario');

// Chave secreta para geração de tokens JWT
const SECRET = 'controle-financeiro-secret-key';

module.exports = (app) => {
  const controller = {};
  
  // Login
  controller.login = async (req, res) => {
    try {
      const { login, senha } = req.body;
      console.log('Tentativa de login:', { login, senha });
      
      // Verifica se os campos foram fornecidos
      if (!login || !senha) {
        console.log('Campos obrigatórios não fornecidos');
        return res.status(400).json({ message: 'Login e senha são obrigatórios' });
      }
      
      // Busca o usuário pelo login
      const usuario = await Usuario.findOne({ where: { login } });
      console.log('Usuário encontrado:', usuario ? 'sim' : 'não');
      if (usuario) {
        console.log('Dados do usuário:', { id: usuario.id, login: usuario.login, senha: usuario.senha.substring(0, 20) + '...' });
      }
      
      // Verifica se o usuário existe
      if (!usuario) {
        console.log('Usuário não encontrado');
        return res.status(401).json({ message: 'Login ou senha incorretos' });
      }
      
      // Verifica a senha
      console.log('Verificando senha...');
      const senhaCorreta = await usuario.verificarSenha(senha);
      console.log('Senha correta:', senhaCorreta);
      if (!senhaCorreta) {
        console.log('Senha incorreta');
        return res.status(401).json({ message: 'Login ou senha incorretos' });
      }
      
      // Gera o token JWT
      const token = jwt.sign(
        { id: usuario.id, admin: usuario.admin },
        SECRET,
        { expiresIn: '24h' }
      );
      
      // Retorna os dados do usuário e o token
      return res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        saldo: usuario.saldo,
        admin: usuario.admin,
        token
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Registrar novo usuário
  controller.register = async (req, res) => {
    try {
      const { nome, login, senha, data_nascimento } = req.body;
      
      // Verifica se os campos obrigatórios foram fornecidos
      if (!nome || !login || !senha || !data_nascimento) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }
      
      // Verifica se o login já está em uso
      const usuarioExistente = await Usuario.findOne({ where: { login } });
      if (usuarioExistente) {
        return res.status(400).json({ message: 'Este login já está em uso' });
      }
      
      // Cria o novo usuário
      const novoUsuario = await Usuario.create({
        nome,
        login,
        senha,
        data_nascimento,
        saldo: 0,
        admin: false
      });
      
      // Cria categorias iniciais para o usuário
      const { inicializarCategorias } = require('../models/Categoria');
      await inicializarCategorias(novoUsuario.id);
      
      // Gera o token JWT
      const token = jwt.sign(
        { id: novoUsuario.id, admin: novoUsuario.admin },
        SECRET,
        { expiresIn: '24h' }
      );
      
      // Retorna os dados do novo usuário e o token
      return res.status(201).json({
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        login: novoUsuario.login,
        saldo: novoUsuario.saldo,
        admin: novoUsuario.admin,
        token
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Middleware para verificar autenticação
  controller.verificarToken = (req, res, next) => {
    // Obter o token do header
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    
    // Verificar se o token foi fornecido
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    // Remover 'Bearer ' se presente
    const tokenLimpo = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    
    // Verificar e decodificar o token
    jwt.verify(tokenLimpo, SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
      }
      
      // Armazenar os dados do usuário decodificados na request
      req.usuario = decoded;
      next();
    });
  };
  
  return controller;
};
