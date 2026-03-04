let tempToken = null;

async function login() {
    const telegram = document.getElementById('telegram').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/auth/login-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram, password })
    });

    const data = await res.json();

    if (data.needCode) {
        tempToken = data.tempToken;
        document.getElementById('loginPanel').classList.add('hidden');
        document.getElementById('codePanel').classList.remove('hidden');
        document.querySelector('.code-inputs input').focus();
    } else {
        alert(data.error);
    }
}

const inputs = document.querySelectorAll('.code-inputs input');

inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
        if (input.value && inputs[i + 1]) inputs[i + 1].focus();

        const code = [...inputs].map(i => i.value).join('');
        if (code.length === 6) submitCode(code);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !input.value && inputs[i - 1]) {
            inputs[i - 1].focus();
        }
    });
});

async function submitCode(code) {
    const res = await fetch('/api/auth/login-step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code })
    });

    const data = await res.json();
    if (data.success) {
        localStorage.setItem('token', data.token);
        location.reload();
    } else {
        alert(data.error);
    }
}

document.querySelector('.back-btn').onclick = () => {
    document.getElementById('codePanel').classList.add('hidden');
    document.getElementById('loginPanel').classList.remove('hidden');
};