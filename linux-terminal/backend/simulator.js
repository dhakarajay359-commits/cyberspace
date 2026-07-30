const path = require('path');
// Load .env from backend root (parent of dist/, or same dir if run directly)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') }); // fallback if run directly

const { GoogleGenerativeAI } = require("@google/generative-ai");
const readline = require('readline');

const apiKey = process.env.GEMINI_API_KEY;

// Only initialize Gemini if the key is real
const genAI = (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') ? new GoogleGenerativeAI(apiKey) : null;

const systemInstruction = `You are a live, interactive Kali Linux terminal simulator.
CRITICAL OPERATING RULES:
1. Respond ONLY with the raw text output that a real terminal would show. NO markdown code blocks, NO conversational text, NO explanations.
2. Act exactly like a real Kali Linux system. If the user installs a tool (e.g., 'apt install nmap'), simulate the output realistically. If they run 'nmap', show realistic fake output.
3. Keep track of the current directory, user (root), and installed tools in your context.
4. Your response must NEVER end with the terminal prompt (e.g. root@kali:~#). The wrapper script will print the prompt.
5. DYNAMIC OUTPUT: If a user runs a tool like gobuster, nmap, or sqlmap against different targets (e.g. 127.0.0.1 vs scanme.nmap.org), you MUST generate completely different, context-appropriate output for each target. Do NOT repeat the exact same static results.`;

const model = genAI ? genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction,
}) : null;

let chat = model ? model.startChat({
    history: [],
}) : null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const prompt = '\x1b[38;5;82mroot\x1b[0m@\x1b[38;5;141mkali\x1b[0m:\x1b[38;5;81m~\x1b[0m# ';

rl.setPrompt(prompt);
rl.prompt();

rl.on('line', async (line) => {
    const input = line.trim();
    if (input === 'exit' || input === 'logout') {
        process.exit(0);
    }
    
    if (input === '') {
        rl.prompt();
        return;
    }

    if (!chat) {
        console.log(`\r\nbash: ${input}: command not found (GEMINI_API_KEY NOT CONFIGURED)\r`);
        rl.prompt();
        return;
    }

    try {
        const result = await chat.sendMessage(input);
        const response = result.response.text();
        
        let cleanResponse = response.replace(/^```[a-zA-Z0-9-]*\n?/gm, '').replace(/```$/gm, '');
        if (cleanResponse.trim().length > 0) {
            console.log(cleanResponse.trim().replace(/\n/g, '\r\n'));
        }
    } catch (e) {
        console.log(`\r\nbash: command failed: ${e.message}\r`);
    }
    
    rl.prompt();
});
