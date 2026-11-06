const pathParts = location.pathname.split('/').filter(Boolean);
const token = pathParts[1] || '';
const loading = document.getElementById('loading');
const registration = document.getElementById('registration');
const codeElement = document.getElementById('code');
const result = document.getElementById('result');
const form = document.getElementById('verifyForm');
let codeValue = '';

function showResult(message, type) {
  result.textContent = message;
  result.className = `result ${type || ''}`;
}

async function loadDetails() {
  try {
    if (!token) throw new Error('Link de cadastro inválido. Gere outro pelo Discord.');
    const response = await fetch(`/api/register/details?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o cadastro.');
    codeValue = data.code;
    codeElement.textContent = codeValue;
    loading.hidden = true;
    registration.hidden = false;
  } catch (error) {
    loading.textContent = error.message;
    loading.classList.add('error');
  }
}

document.getElementById('copyCode').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeValue);
    showResult('Código copiado. Agora cole na biografia do Roblox.', 'success');
  } catch {
    showResult('Selecione e copie o código manualmente.', 'error');
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Verificando...';
  showResult('Consultando a conta e a biografia no Roblox...', '');
  try {
    const response = await fetch('/api/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, username: document.getElementById('username').value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao verificar a conta.');
    registration.hidden = true;
    showResult(`${data.message} Usuário vinculado: ${data.username}.`, 'success');
  } catch (error) {
    showResult(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Confirmar minha conta';
  }
});

loadDetails();
