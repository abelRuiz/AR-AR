const button = document.getElementById('open-note');
const passwordInput = document.getElementById('password');
const message = document.getElementById('message');

const encryptedData = {
    salt: 'pjOlkFpBM0zpD/z6H3+00Q==',
    iv: 'KGoX6/EQG0IiVANJ',
    ciphertext: 'HqkL04uA3IoZ3eGi/NXzrkdhNlHA+gRMtbbuGm/7G4QQnkm0lDg='
};

button.addEventListener('click', async () => {
    const password = passwordInput.value.trim();

    if (!password) {
        message.textContent = 'Ingresa un código.';
        return;
    }

    try {
        const note = await decryptNote(
            password,
            encryptedData.salt,
            encryptedData.iv,
            encryptedData.ciphertext
        );

        showNote(note);
    } catch {
        message.textContent = 'Código incorrecto.';
    }
});

async function decryptNote(password, saltBase64, ivBase64, ciphertextBase64) {
    const encoder = new TextEncoder();

    const salt = base64ToBytes(saltBase64);
    const iv = base64ToBytes(ivBase64);
    const ciphertext = base64ToBytes(ciphertextBase64);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 250000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

function base64ToBytes(base64) {
    const binary = atob(base64);

    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function showNote(note) {
    document.querySelector('.card').innerHTML = `
        <h1>Una nota para ti</h1>
        <div class="note">${escapeHtml(note)}</div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;

    return div.innerHTML.replace(/\n/g, '<br>');
}	