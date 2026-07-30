
        const originalWarn = console.warn;
        console.warn = function(...args) {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com should not be used in production')) return;
            originalWarn.apply(console, args);
        };
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --bg-base: #F9F8F6;
            --bg-card: #FFFFFF;
            --text-main: #1A1D20;
            --text-muted: #5A5D60;
            --accent: #6B705C;
            --border-color: #E5E5E5;
            --font-sans: 'Inter', sans-serif;
            --font-serif: 'Lora', serif;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--bg-base);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
            overflow: hidden;
            margin: 0;
        }

        .login-layout {
            display: flex;
            width: 100vw;
            height: 100vh;
        }

        .login-image {
            flex: 1;
            background: url('/static/assets/cyber_hero_1785045582652.png') center/cover no-repeat;
            position: relative;
        }

        .login-image::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(26, 29, 32, 0.1);
        }

        .login-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-base);
        }

        .login-card {
            width: 100%;
            max-width: 440px;
            padding: 48px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.04);
        }

        h2 {
            font-family: var(--font-serif);
            font-size: 2.2rem;
            margin-bottom: 8px;
            color: var(--text-main);
            font-weight: 400;
        }

        p.subtitle {
            font-size: 0.95rem;
            color: var(--text-muted);
            margin-bottom: 32px;
        }

        .tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 32px;
        }

        .tab {
            flex: 1;
            padding: 12px;
            text-align: center;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            transition: all 0.3s;
        }

        .tab.active {
            background: var(--text-main);
            color: white;
            border-color: var(--text-main);
        }

        .input-group {
            margin-bottom: 20px;
        }

        .input-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 8px;
            color: var(--text-muted);
        }

        .input-group input {
            width: 100%;
            padding: 14px 16px;
            font-size: 0.95rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-base);
            color: var(--text-main);
            transition: border-color 0.3s, box-shadow 0.3s;
            box-sizing: border-box;
        }

        .input-group input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(107, 112, 92, 0.1);
        }

        .btn-main {
            width: 100%;
            padding: 14px;
            font-size: 0.95rem;
            font-weight: 500;
            background: var(--text-main);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .btn-main:hover {
            background: #000;
        }

        .btn-google {
            width: 100%;
            padding: 14px;
            font-size: 0.95rem;
            font-weight: 500;
            background: white;
            color: var(--text-main);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            cursor: pointer;
            margin-top: 16px;
            transition: background 0.3s;
        }

        .btn-google:hover {
            background: var(--bg-base);
        }

        #toast {
            position: fixed;
            top: 24px;
            right: 24px;
            padding: 16px 24px;
            background: var(--text-main);
            color: white;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 12px 24px rgba(0,0,0,0.1);
            display: none;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .login-image {
                display: none;
            }
        }
    </style>
</head>
<body>

<div class="login-layout">
    <div class="login-image"></div>
    <div class="login-container">
        <div class="login-card">
            <h2>Access Portal</h2>
            <p class="subtitle">Enter your credentials to continue.</p>
            
            <div class="tabs">
                <div class="tab active" id="tab-login" onclick="setMode('login')">Sign In</div>
                <div class="tab" id="tab-register" onclick="setMode('register')">Register</div>
            </div>

            <input type="hidden" id="auth-mode" value="login">
            
            <div class="input-group">
                <label>Username</label>
                <input type="text" id="username" placeholder="name@company.com">
            </div>
            
            <div class="input-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="••••••••">
            </div>

            <button class="btn-main" id="btn-login" onclick="handleAuth()">Authenticate</button>
            <button class="btn-google" onclick="googleLogin()">Continue with Google</button>
        </div>
    </div>
</div>

<div id="toast"></div>

<script>
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
