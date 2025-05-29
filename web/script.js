const API_ENDPOINT_COMPARE = 'https://p5l6ilgvui.execute-api.us-east-1.amazonaws.com/prod/face/compare';
const API_ENDPOINT_VALIDATE_CODE = 'https://p5l6ilgvui.execute-api.us-east-1.amazonaws.com/prod/totp/validate';

let currentUser = null;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const resultBox = document.getElementById('resultBox');
const loading = document.getElementById('loading');
const infoMessage = document.getElementById('infoMessage');
const capturedThumbnail = document.getElementById('capturedThumbnail');
const verifyCodeSection = document.getElementById('verifyCodeSection');

// Ativar webcam
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    console.error('Erro ao acessar a câmera:', err);
    resultBox.textContent = 'Erro ao acessar a câmera: ' + err.message;
  }
}

startCamera();

// Capturar imagem do vídeo
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];
  capturedThumbnail.src = canvas.toDataURL('image/jpeg');
  capturedThumbnail.style.display = 'block';

  uploadCapturedImage(base64Data);
});

async function uploadCapturedImage(base64Data) {
  resultBox.textContent = '';
  loading.style.display = 'block';
  verifyCodeSection.style.display = 'none';
  infoMessage.textContent = '';

  try {
    const response = await fetch(API_ENDPOINT_COMPARE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data }),
    });

    const data = await response.json();
    console.log('Resposta:', data);

    if (data.match && data.user) {
      currentUser = data.user;

      resultBox.textContent = `✅ Rosto reconhecido: ${currentUser.name}\nFoi enviado um código para verificação.`;
      verifyCodeSection.style.display = 'block';
    } else {
      resultBox.textContent = "❌ Autenticação facial falhou.";
    }

  } catch (err) {
    resultBox.textContent = 'Erro: ' + err.message;
  } finally {
    loading.style.display = 'none';
  }
}

async function submitVerificationCode() {
  const code = document.getElementById('codeInput').value;
  const codeError = document.getElementById('codeError');

  if (!code || code.length !== 6) {
    codeError.textContent = 'Insere um código válido de 6 dígitos.';
    return;
  }

  try {
    const response = await fetch(API_ENDPOINT_VALIDATE_CODE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUser.id, code })
    });

    const result = await response.json();
    console.log('Verificação do código:', result);

    if (result.success) {
      window.location.href = `welcome.html?name=${encodeURIComponent(currentUser.name)}&similarity=${currentUser.similarity}&imageUrl=${encodeURIComponent(result.image_url)}&last_login=${encodeURIComponent(result.last_login)}`;
    } else {
      codeError.textContent = '❌ Código incorreto ou expirado.';
    }

  } catch (err) {
    codeError.textContent = 'Erro ao verificar código: ' + err.message;
  }
}