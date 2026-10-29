// Alterna qual botão de papel (Contratar / Trabalhar) está ativo
function setRole(role) {
  document.getElementById('btnContratar').classList.toggle('active', role === 'contratar');
  document.getElementById('btnTrabalhar').classList.toggle('active', role === 'trabalhar');
}

// Mostra/oculta o campo de senha
function togglePassword(id, btn) {
  const input = document.getElementById(id);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁';
}

// Envio do formulário de login
function handleLogin(e) {
  e.preventDefault();
  alert('Login enviado (integrar com backend aqui).');
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleSenhaBtn = document.getElementById('toggleSenha');
  toggleSenhaBtn.addEventListener('click', () => togglePassword('senha', toggleSenhaBtn));

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', handleLogin);
});
