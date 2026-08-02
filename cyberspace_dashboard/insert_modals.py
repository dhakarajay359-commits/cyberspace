import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure we don't insert twice
if 'id="pricing-modal"' not in text:
    modals = '''        <!-- MODALS -->
        <!-- Pricing Modal -->
        <div id="pricing-modal" class="modal-backdrop hidden">
            <div class="bg-slate-900 border-2 border-amber-500 rounded-xl p-8 max-w-2xl w-full mx-4 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-black text-white">Upgrade to Pro</h2>
                    <button onclick="closePricingModal()" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <p class="text-slate-400 mb-6">Unlock remediation guides, real-time threat intelligence, and automated fixes.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="border border-slate-700 p-6 rounded cursor-pointer hover:border-amber-500 transition" onclick="selectPlan('pro')">
                        <h3 class="text-xl font-bold text-amber-500 mb-2">Pro</h3>
                        <p class="text-2xl font-black text-white mb-4">$12<span class="text-sm text-slate-500">/mo</span></p>
                        <ul class="text-sm text-slate-400 space-y-2 mb-6">
                            <li>o" Advanced Vulnerability Fixes</li>
                            <li>o" 1-Click Code Generation</li>
                            <li>o" Real-time Dark Web Monitoring</li>
                        </ul>
                        <button class="w-full bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-700">Select Pro</button>
                    </div>
                    <div class="border border-slate-700 p-6 rounded cursor-pointer hover:border-indigo-500 transition" onclick="selectPlan('enterprise')">
                        <h3 class="text-xl font-bold text-indigo-500 mb-2">Enterprise</h3>
                        <p class="text-2xl font-black text-white mb-4">$49<span class="text-sm text-slate-500">/mo</span></p>
                        <ul class="text-sm text-slate-400 space-y-2 mb-6">
                            <li>o" Everything in Pro</li>
                            <li>o" Dedicated Account Manager</li>
                            <li>o" Custom API Integrations</li>
                        </ul>
                        <button class="w-full bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-700">Select Enterprise</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div id="payment-modal" class="modal-backdrop hidden">
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-black text-white">Complete Payment</h2>
                    <button onclick="document.getElementById('payment-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <div class="mb-6">
                    <p class="text-slate-300">Plan: <span id="payment-plan-name" class="font-bold text-amber-500"></span></p>
                    <p class="text-slate-300">Total: <span id="payment-plan-price" class="font-bold text-white"></span></p>
                </div>
                <input type="hidden" id="payment-plan-key">
                <div class="space-y-4 mb-6">
                    <input type="text" placeholder="Card Number" class="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white">
                    <div class="flex gap-4">
                        <input type="text" placeholder="MM/YY" class="w-1/2 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white">
                        <input type="text" placeholder="CVC" class="w-1/2 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white">
                    </div>
                </div>
                <button id="btn-pay" onclick="submitPayment()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded shadow-lg transition">Pay Now</button>
            </div>
        </div>

        <!-- Success Modal -->
        <div id="success-modal" class="modal-backdrop hidden">
            <div class="bg-slate-900 border-2 border-emerald-500 rounded-xl p-8 max-w-md w-full mx-4 text-center">
                <div class="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl text-white font-black">o"</span>
                </div>
                <h2 class="text-2xl font-black text-white mb-2">Payment Successful!</h2>
                <p class="text-slate-400 mb-6">Your account has been upgraded. You now have full access to remediation features.</p>
                <button onclick="document.getElementById('success-modal').classList.add('hidden')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition">Continue to Dashboard</button>
            </div>
        </div>

        <!-- Partner Modal -->
        <div id="partner-modal" class="modal-backdrop hidden">
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 id="partner-modal-title" class="text-xl font-black text-white">Connect Partner</h2>
                    <button onclick="document.getElementById('partner-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <p class="text-slate-400 text-sm mb-4">Enter your API key to connect this integration.</p>
                <input type="text" id="partner-api-key" placeholder="API Key..." class="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white mb-6 font-mono text-sm">
                <button id="partner-modal-submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition">Connect Integration</button>
            </div>
        </div>'''
    # Insert right before <script>
    text = text.replace('<script>', modals + '\n    <script>')
    with open('templates/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Modals inserted!")
else:
    print("Modals already present!")
