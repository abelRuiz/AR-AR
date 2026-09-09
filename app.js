const button = document.getElementById('open-note');
const passwordInput = document.getElementById('password');
const message = document.getElementById('message');

const encryptedData = window.encryptedData;

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
    const config = window.letterConfig ?? {
        title: 'Una carta para ti',
        date: ''
    };

    document.querySelector('.card').innerHTML = `
        <h1>${escapeHtml(config.title)}</h1>

        ${
            config.date
                ? `<p class="letter-date">${escapeHtml(config.date)}</p>`
                : ''
        }

        <div class="note">
            ${formatNote(note)}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;

    return div.innerHTML;
}

function formatNote(text) {
    let formatted = escapeHtml(text);

    // Negritas
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
    );

    // Cursivas
    formatted = formatted.replace(
        /\*(.*?)\*/g,
        '<em>$1</em>'
    );

    // Saltos de línea
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}
