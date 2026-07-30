
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    function setMode(mode) {
        document.getElementById('auth-mode').value = mode;
        const btnLogin = document.getElementById('tab-login');
        const btnReg = document.getElementById('tab-register');
        const mainBtn = document.getElementById('btn-login');

        if(mode === 'login') {
            btnLogin.classList.add('active');
            btnReg.classList.remove('active');
            mainBtn.textContent = 'Authenticate';
        } else {
            btnReg.classList.add('active');
            btnLogin.classList.remove('active');
            mainBtn.textContent = 'Register User';
        }
    }

    async function handleAuth() {
        const mode = document.getElementById('auth-mode').value;
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const btn = document.getElementById('btn-login');

        if (!username || !password) {
            showToast('Please fill in all fields.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            const response = await fetch('/auth/' + mode, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                showToast(mode === 'login' ? 'Access Granted' : 'Registration Complete. Please login.');
                if (mode === 'login') {
                    btn.textContent = 'Granted';
                    setTimeout(() => { window.location.href = data.redirect; }, 800);
                } else {
                    btn.textContent = 'Success';
                    setTimeout(() => {
                        setMode('login');
                        document.getElementById('password').value = '';
                        btn.disabled = false;
                        btn.textContent = 'Authenticate';
                    }, 1500);
                }
            } else {
                showToast(data.error);
                btn.disabled = false;
                btn.textContent = mode === 'login' ? 'Authenticate' : 'Register User';
            }
        } catch (err) {
            showToast('Network Error. Please try again.');
            btn.disabled = false;
            btn.textContent = mode === 'login' ? 'Authenticate' : 'Register User';
        }
    }

    async function googleLogin() {
        const email = prompt("Google Auth (Simulator): Enter your Gmail address:");
        if (!email) return;
        
        try {
            const response = await fetch('/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const data = await response.json();
            if (data.success) {
                showToast('Google Sign-In Successful');
                setTimeout(() => { window.location.href = data.redirect; }, 800);
            } else {
                showToast(data.error);
            }
        } catch (err) {
            showToast('Network Error. Please try again.');
        }
    }

    document.getElementById('username').addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
    document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
