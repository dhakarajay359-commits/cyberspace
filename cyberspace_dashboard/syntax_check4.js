active_page = "compete" */
/* extends "base.html" */

/* block extra_head */
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #050a0f; color: #e2e8f0; overflow-x: hidden; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        
        /* Background */
        .bg-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: radial-gradient(circle at center, transparent 0%, #020617 80%); pointer-events: none; }
        
        /* Clean Header */
        .header-title { color: #f8fafc; font-weight: 800; font-size: 2.25rem; text-transform: uppercase; letter-spacing: 2px; }

        /* Nav Sidebar */
        .sidebar { width: 80px; transition: width 0.3s ease; }
        .sidebar:hover { width: 220px; }
        .nav-item { white-space: nowrap; overflow: hidden; opacity: 0; transition: opacity 0.3s; margin-left: 12px; }
        .sidebar:hover .nav-item { opacity: 1; }

        /* Cyber Glows */
        .glass-panel {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(16, 185, 129, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(16, 185, 129, 0.05);
            border-radius: 12px;
        }
        .glow-green { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); border-color: rgba(16, 185, 129, 0.6); }
        .glow-red { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.6); }
        
        /* Radar Sweep */
        .radar-box { position: relative; overflow: hidden; border-radius: 50%; width: 120px; height: 120px; border: 2px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05); }
        .radar-box::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 50%; height: 50%;
            transform-origin: top left; background: linear-gradient(45deg, rgba(16, 185, 129, 0.8) 0%, transparent 50%);
            animation: radar-spin 2s linear infinite;
        }
        @keyframes radar-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* Neon Button */
        .btn-neon {
            background: transparent; color: #10b981; border: 1px solid #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.3);
            transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 2px;
        }
        .btn-neon:hover {
            background: #10b981; color: #000;
        /* Cyber Glows */

        .glass-panel {

            background: rgba(15, 23, 42, 0.7);

            backdrop-filter: blur(12px);

            border: 1px solid rgba(16, 185, 129, 0.2);

            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(16, 185, 129, 0.05);

            border-radius: 12px;

        }

        .glow-green { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); border-color: rgba(16, 185, 129, 0.6); }

        .glow-red { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.6); }

        

        /* Radar Sweep */

        .radar-box { position: relative; overflow: hidden; border-radius: 50%; width: 120px; height: 120px; border: 2px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05); }

        .radar-box::after {

            content: ''; position: absolute; top: 50%; left: 50%; width: 50%; height: 50%;

            transform-origin: top left; background: linear-gradient(45deg, rgba(16, 185, 129, 0.8) 0%, transparent 50%);

            animation: radar-spin 2s linear infinite;

        }

        @keyframes radar-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        

        /* Neon Button */

        .btn-neon {

            background: transparent; color: #10b981; border: 1px solid #10b981;

            box-shadow: 0 0 10px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.3);

            transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 2px;

        }

        .btn-neon:hover {

            background: #10b981; color: #000;

            box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), inset 0 0 20px rgba(16, 185, 129, 0.8);

        }



        /* Pulse */

        @keyframes pulse-ring {

            0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }

            70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }

            100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }

        }

        .pulse-live { animation: pulse-ring 2s infinite; border-radius: 50%; width: 12px; height: 12px; background: #ef4444; display: inline-block; margin-right: 8px; }



        /* Table rows hover */

        tr.hacker-row:hover { background: rgba(16, 185, 129, 0.1); cursor: crosshair; }



        /* ─── BREACH EVENT STYLES ─── */

        #breach-overlay {

            position: fixed; inset: 0; z-index: 9000;

            background: rgba(0,0,0,0.92);

            display: flex; align-items: center; justify-content: center;

            opacity: 0; pointer-events: none;

            transition: opacity 0.4s ease;

        }

        #breach-overlay.show { opacity: 1; pointer-events: all; }

        #breach-box {

            background: #0a0000;

            border: 2px solid #ef4444;

            box-shadow: 0 0 60px rgba(239,68,68,0.6), 0 0 120px rgba(239,68,68,0.3);

            border-radius: 12px; padding: 48px; max-width: 650px; width: 90%;

            text-align: center; position: relative;

        }

        @keyframes breach-flicker { 0%,100%{opacity:1} 50%{opacity:0.7} 92%{opacity:0.8} }

        .breach-skull { font-size: 80px; animation: breach-flicker 0.8s infinite; }

        @keyframes breach-text-glitch {

            0%{transform:translateX(0)} 20%{transform:translateX(-3px)} 40%{transform:translateX(3px)}

            60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} 100%{transform:translateX(0)}

        }

        .breach-title { animation: breach-text-glitch 0.15s infinite; }

        @keyframes scanline-red {

            0%{top:-4px} 100%{top:100*/

        }

        #breach-box::after {

            content:''; position:absolute; left:0; right:0; height:3px;

            background:linear-gradient(to right, transparent, rgba(239,68,68,0.7), transparent);

            animation: scanline-red 2s linear infinite; pointer-events:none;

        }

        /* Red Team Victory */

        #red-victory-overlay {

            position: fixed; inset: 0; z-index: 9000;

            background: rgba(0,0,0,0.92);

            display: flex; align-items: center; justify-content: center;

            opacity: 0; pointer-events: none;

            transition: opacity 0.4s ease;

        }

        #red-victory-overlay.show { opacity: 1; pointer-events: all; }

        @keyframes victory-pulse { 0%,100%{box-shadow:0 0 40px rgba(16,185,129,0.5)} 50%{box-shadow:0 0 80px rgba(16,185,129,0.9)} }

        #victory-box {

            background: #000a05;

            border: 2px solid #10b981;

            box-shadow: 0 0 60px rgba(16,185,129,0.6);

            border-radius: 12px; padding: 48px; max-width: 600px; width: 90%;

            text-align: center;

            animation: victory-pulse 1.5s infinite;

        }

        

        /* Blue Team Victory */

        #blue-victory-overlay {

            position: fixed; inset: 0; z-index: 9000;

            background: rgba(0,0,0,0.92);

            display: flex; align-items: center; justify-content: center;

            opacity: 0; pointer-events: none;

            transition: opacity 0.4s ease;

        }

        #how-to-play-modal.show { opacity: 1; pointer-events: all; }

        

        .map-node {

            background: #1e293b; border: 2px solid #334155; border-radius: 8px;

            padding: 16px; text-align: center; position: relative; z-index: 2;

        }

        .map-line {

            height: 4px; background: #334155; position: relative;

            flex-grow: 1; margin: 0 10px; z-index: 1;

        }

        

        .payload-dot {

            width: 12px; height: 12px; border-radius: 50%;

            position: absolute; top: -4px; left: 0;

            box-shadow: 0 0 10px currentColor;

        }

        

        @keyframes payload-travel {

            0% { left: 0; opacity: 1; }

            90% { opacity: 1; }

            100% { left: 100%; opacity: 0; }

        }

        @keyframes payload-blocked {

            0% { left: 0; opacity: 1; transform: scale(1); }

            45% { left: 50%; opacity: 1; transform: scale(1); }

            50% { left: 50%; opacity: 0; transform: scale(2); }

            100% { left: 50%; opacity: 0; }

        }

        

        .animate-travel { animation: payload-travel 2s infinite linear; }

        .animate-block { animation: payload-blocked 2s infinite linear; }



        /* ─── ATTACK / DEFENSE PANEL STYLES ─── */

        .attack-tab {

            color: #64748b; background: transparent;

            border-bottom: 2px solid transparent;

            transition: all 0.2s;

        }

        .attack-tab:hover { color: #ef4444; }

        .active-tab { color: #ef4444 !important; border-bottom-color: #ef4444 !important; }



        .payload-card {

            background: rgba(239,68,68,0.05);

            border: 1px solid rgba(239,68,68,0.2);

            border-radius: 8px; padding: 10px 12px;

        }

        .payload-card:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.4); }



        .payload-btn {

            background: rgba(0,0,0,0.6);

            border: 1px solid rgba(239,68,68,0.3);

            color: #fca5a5; font-family: monospace; font-size: 11px;

            padding: 4px 10px; border-radius: 4px; cursor: pointer;

            transition: all 0.15s; text-align: left; width: 100%; margin-bottom: 4px;

        }

        .payload-btn:hover { background: #7f1d1d; color: #fff; border-color: #ef4444; }



        .defense-btn {

            width: 100%; text-align: left; padding: 8px 12px;

            border-radius: 6px; font-family: monospace; font-size: 11px;

            cursor: pointer; transition: all 0.2s; margin-bottom: 6px;

            border: 1px solid rgba(59,130,246,0.3);

            background: rgba(59,130,246,0.05); color: #93c5fd;

        }

        .defense-btn:hover { background: rgba(59,130,246,0.2); border-color: #3b82f6; color: #fff; }

        .defense-btn.deployed {

            background: rgba(16,185,129,0.15); border-color: #10b981;

            color: #6ee7b7; cursor: default;

        }

        .defense-btn.deployed::after { content: ' ✓ ACTIVE'; color: #10b981; font-weight: bold; }

    </style>

/* endblock */

/* block content */





    <canvas id="matrix-bg"></canvas>

    <div class="bg-overlay"></div>



    <!-- SIDEBAR -->

    <aside class="sidebar h-full bg-[#03060a] border-r border-emerald-900/40 flex flex-col items-center py-6 fixed left-0 top-0 z-50">

        <div class="w-10 h-10 bg-emerald-500/20 rounded-xl border border-emerald-500/50 flex items-center justify-center mb-10 shadow-[0_0_15px_rgba(16,185,129,0.3)]">

            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>

        </div>



        

    </aside>



    <!-- MAIN CONTENT -->

    </style>

/* endblock */