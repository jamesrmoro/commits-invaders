function startGameFromModal() {
  const input = document.getElementById('modalUsername');
  const username = input.value.trim();
  if (!username) {
    input.placeholder = "⚠ Nome obrigatório";
    return;
  }

  const usernameInput = document.getElementById('username');
  const loadButton = document.getElementById('loadButton');

  if (!usernameInput || !loadButton) {
    console.error("Elemento oculto não encontrado.");
    return;
  }

  usernameInput.value = username;
  loadButton.click();

  const modal = document.getElementById('gameModal');
  modal.classList.remove('visible');
}

// effects.js
function showModal(title, message) {
  const modal = document.getElementById('gameModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');

  modalTitle.textContent = title;
  modalMessage.textContent = message;

  modal.classList.add('visible');
}

function hideModal() {
  const modal = document.getElementById('gameModal');
  modal.classList.remove('visible');
}