// Alterna qual papel (Trabalhar / Contratar) está ativo
function setRole(role) {
  document.getElementById('btnContratar').classList.toggle('active', role === 'contratar');
  document.getElementById('btnTrabalhar').classList.toggle('active', role === 'trabalhar');
}

// Mostra/oculta um campo de senha específico
function togglePassword(id, btn) {
  const input = document.getElementById(id);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁';
}

// Envio do formulário de cadastro
function handleSignup(e) {
  e.preventDefault();

  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;

  if (senha !== confirmarSenha) {
    alert('As senhas não coincidem.');
    return false;
  }

  alert('Cadastro enviado (integrar com backend aqui).');
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleSenhaBtn = document.getElementById('toggleSenha');
  toggleSenhaBtn.addEventListener('click', () => togglePassword('senha', toggleSenhaBtn));

  const toggleConfirmarSenhaBtn = document.getElementById('toggleConfirmarSenha');
  toggleConfirmarSenhaBtn.addEventListener('click', () => togglePassword('confirmarSenha', toggleConfirmarSenhaBtn));

  const form = document.getElementById('cadastroForm');
  form.addEventListener('submit', handleSignup);
});
