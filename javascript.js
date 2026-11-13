// ==========================================
// INICIALIZAÇÃO E GERENCIAMENTO DE DADOS
// ==========================================

const STORAGE_KEYS = {
    ACCOUNTS: 'novabank_accounts',
    TRANSACTIONS: 'novabank_transactions',
    SESSION: 'novabank_session'
};

// Dados iniciais caso o LocalStorage esteja vazio
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
        const defaultAccounts = [
            {
                number: '1001',
                name: 'Carlos Silva',
                cpf: '123.456.789-00',
                password: '123',
                balance: 2500.00,
                status: 'ATIVA',
                card: {
                    number: '4532 8910 2341 9012',
                    expiry: '08/30',
                    cvv: '412'
                }
            }
        ];
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(defaultAccounts));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        const defaultTransactions = [
            {
                id: 1,
                account: '1001',
                type: 'DEPÓSITO',
                description: 'Depósito Inicial',
                amount: 2500.00,
                date: new Date().toLocaleString('pt-BR')
            }
        ];
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(defaultTransactions));
    }
}

function getAccounts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) || [];
}

function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

function getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
}

function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// AUTENTICAÇÃO E CONTROLE DE SESSÃO
// ==========================================

let currentUser = null;

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const userInput = document.getElementById('login-user').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();

    // Login Administrador
    if (userInput === 'admin' && passInput === '1234') {
        currentUser = { role: 'ADMIN', name: 'Administrador Geral' };
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
        loadApp();
        return;
    }

    // Login Cliente (pelo número da conta)
    const accounts = getAccounts();
    const account = accounts.find(acc => acc.number === userInput && acc.password === passInput);

    if (account) {
        if (account.status === 'ENCERRADA') {
            alert('Esta conta foi encerrada. Entre em contato com a administração.');
            return;
        }
        currentUser = { role: 'CLIENT', name: account.name, accountNumber: account.number };
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
        loadApp();
    } else {
        alert('Usuário ou senha inválidos!');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    currentUser = null;
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('login-form').reset();
});

// ==========================================
// CARREGAMENTO DA INTERFACE E NAVEGAÇÃO
// ==========================================

function loadApp() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR');

    document.getElementById('logged-user-name').textContent = currentUser.name;
    document.getElementById('logged-user-role').textContent = 
        currentUser.role === 'ADMIN' ? 'Administrador' : `Conta: ${currentUser.accountNumber}`;

    buildMenu();
    switchTab('dashboard');
}

function buildMenu() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';

    const adminMenus = [
        { id: 'dashboard', icon: 'bx-grid-alt', label: 'Dashboard' },
        { id: 'open-account', icon: 'bx-user-plus', label: 'Abrir Conta' },
        { id: 'manage-accounts', icon: 'bx-list-ul', label: 'Gerenciar Contas' },
        { id: 'operations', icon: 'bx-transfer', label: 'Depósitos / Saques' },
        { id: 'loan', icon: 'bx-calculator', label: 'Simular Financiamento' }
    ];

    const clientMenus = [
        { id: 'dashboard', icon: 'bx-grid-alt', label: 'Meu Painel' },
        { id: 'operations', icon: 'bx-transfer', label: 'Depósito e Saque' },
        { id: 'statement', icon: 'bx-receipt', label: 'Extrato e Saldo' },
        { id: 'my-card', icon: 'bx-credit-card', label: 'Cartão de Débito' },
        { id: 'loan', icon: 'bx-calculator', label: 'Financiamento' }
    ];

    const menus = currentUser.role === 'ADMIN' ? adminMenus : clientMenus;

    menus.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.dataset.tab = item.id;
        btn.innerHTML = `<i class='bx ${item.icon}'></i> ${item.label}`;
        btn.onclick = () => switchTab(item.id);
        nav.appendChild(btn);
    });
}

function switchTab(tabId) {
    // Atualiza botões do menu
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Atualiza conteúdo visível
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Atualiza título e dados específicos da aba
    const titles = {
        'dashboard': 'Dashboard - Visão Geral',
        'open-account': 'Abertura de Conta',
        'manage-accounts': 'Gerenciamento de Contas',
        'operations': 'Operações Financeiras',
        'statement': 'Extrato Bancário',
        'my-card': 'Cartão de Débito',
        'loan': 'Simulação de Financiamento'
    };
    document.getElementById('page-title').textContent = titles[tabId];

    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'manage-accounts') renderAccountsTable();
    if (tabId === 'operations') setupOperationsTab();
    if (tabId === 'statement') renderStatement();
    if (tabId === 'my-card') renderClientCard();
}

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {
    const accounts = getAccounts();
    const transactions = getTransactions();
    const cardsContainer = document.getElementById('dashboard-cards');
    const tbody = document.getElementById('dashboard-transactions');

    if (currentUser.role === 'ADMIN') {
        const activeAccounts = accounts.filter(a => a.status === 'ATIVA');
        const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        cardsContainer.innerHTML = `
            <div class="stat-card">
                <h4>Total em Custódia no Banco</h4>
                <div class="value">${formatMoney(totalBalance)}</div>
            </div>
            <div class="stat-card">
                <h4>Contas Ativas</h4>
                <div class="value">${activeAccounts.length}</div>
            </div>
            <div class="stat-card">
                <h4>Total de Transações</h4>
                <div class="value">${transactions.length}</div>
            </div>
        `;

        // Últimas 5 transações gerais
        tbody.innerHTML = transactions.slice(-5).reverse().map(t => `
            <tr>
                <td>${t.date}</td>
                <td>${t.account}</td>
                <td>${t.type}</td>
                <td class="${t.type === 'DEPÓSITO' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'DEPÓSITO' ? '+' : '-'} ${formatMoney(t.amount)}
                </td>
            </tr>
        `).join('');
    } else {
        const myAcc = accounts.find(a => a.number === currentUser.accountNumber);
        const myTrans = transactions.filter(t => t.account === currentUser.accountNumber);

        cardsContainer.innerHTML = `
            <div class="stat-card">
                <h4>Saldo Disponível</h4>
                <div class="value">${formatMoney(myAcc.balance)}</div>
            </div>
            <div class="stat-card">
                <h4>Número da Conta</h4>
                <div class="value">${myAcc.number}</div>
            </div>
            <div class="stat-card">
                <h4>Status da Conta</h4>
                <div class="value" style="color: var(--success)">${myAcc.status}</div>
            </div>
        `;

        tbody.innerHTML = myTrans.slice(-5).reverse().map(t => `
            <tr>
                <td>${t.date}</td>
                <td>${t.account}</td>
                <td>${t.type}</td>
                <td class="${t.type === 'DEPÓSITO' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'DEPÓSITO' ? '+' : '-'} ${formatMoney(t.amount)}
                </td>
            </tr>
        `).join('');
    }
}

// ==========================================
// ABERTURA DE CONTA E GERAÇÃO DE CARTÃO
// ==========================================

function generateCardNumber() {
    let num = '4532 ';
    for (let i = 0; i < 3; i++) {
        num += Math.floor(1000 + Math.random() * 9000) + (i < 2 ? ' ' : '');
    }
    return num;
}

document.getElementById('form-open-account').addEventListener('submit', function(e) {
    e.preventDefault();
    const accounts = getAccounts();
    
    const name = document.getElementById('acc-name').value.trim();
    const cpf = document.getElementById('acc-cpf').value.trim();
    const initialDeposit = parseFloat(document.getElementById('acc-deposit').value);
    const password = document.getElementById('acc-pass').value.trim();

    // Gera número sequencial de conta (Ex: 1001, 1002...)
    const nextNumber = (1000 + accounts.length + 1).toString();

    const newCard = {
        number: generateCardNumber(),
        expiry: '11/31',
        cvv: Math.floor(100 + Math.random() * 900).toString()
    };

    const newAccount = {
        number: nextNumber,
        name,
        cpf,
        password,
        balance: initialDeposit,
        status: 'ATIVA',
        card: newCard
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    if (initialDeposit > 0) {
        addTransaction(nextNumber, 'DEPÓSITO', 'Depósito de Abertura de Conta', initialDeposit);
    }

    // Exibe Modal com o Cartão Gerado para Impressão
    document.getElementById('modal-card-number').textContent = newCard.number;
    document.getElementById('modal-card-holder').textContent = name.toUpperCase();
    document.getElementById('modal-card-expiry').textContent = newCard.expiry;
    document.getElementById('modal-card-cvv').textContent = newCard.cvv;
    document.getElementById('modal-acc-num').textContent = nextNumber;

    document.getElementById('card-modal').classList.add('active');
    this.reset();
});

// Fechar Modal do Cartão
document.getElementById('close-card-modal').onclick = () => document.getElementById('card-modal').classList.remove('active');
document.getElementById('btn-done-modal').onclick = () => document.getElementById('card-modal').classList.remove('active');

// ==========================================
// GERENCIAR / FECHAR CONTAS (ADMIN)
// ==========================================

function renderAccountsTable() {
    const accounts = getAccounts();
    const tbody = document.getElementById('accounts-table-body');

    tbody.innerHTML = accounts.map(acc => `
        <tr>
            <td><strong>${acc.number}</strong></td>
            <td>${acc.name}</td>
            <td>${acc.cpf}</td>
            <td>${formatMoney(acc.balance)}</td>
            <td>
                <span class="${acc.status === 'ATIVA' ? 'badge-active' : 'badge-closed'}">
                    ${acc.status}
                </span>
            </td>
            <td>
                ${acc.status === 'ATIVA' 
                    ? `<button class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="closeAccount('${acc.number}')">Encerrar Conta</button>` 
                    : '<small>Encerrada</small>'}
            </td>
        </tr>
    `).join('');
}

window.closeAccount = function(accountNumber) {
    const accounts = getAccounts();
    const acc = accounts.find(a => a.number === accountNumber);

    if (acc.balance > 0) {
        alert(`Não é possível encerrar a conta ${accountNumber} pois ainda há saldo de ${formatMoney(acc.balance)}. Realize o saque total antes.`);
        return;
    }

    if (confirm(`Tem certeza que deseja encerrar permanentemente a conta ${accountNumber} de ${acc.name}?`)) {
        acc.status = 'ENCERRADA';
        saveAccounts(accounts);
        renderAccountsTable();
        alert('Conta encerrada com sucesso!');
    }
};

// ==========================================
// OPERAÇÕES: DEPÓSITO E SAQUE
// ==========================================

function setupOperationsTab() {
    const isClient = currentUser.role === 'CLIENT';
    document.getElementById('admin-dep-acc-group').style.display = isClient ? 'none' : 'block';
    document.getElementById('admin-with-acc-group').style.display = isClient ? 'none' : 'block';
}

function addTransaction(accountNumber, type, description, amount) {
    const transactions = getTransactions();
    transactions.push({
        id: Date.now(),
        account: accountNumber,
        type,
        description,
        amount,
        date: new Date().toLocaleString('pt-BR')
    });
    saveTransactions(transactions);
}

// Depósito
document.getElementById('form-deposit').addEventListener('submit', function(e) {
    e.preventDefault();
    const accNum = currentUser.role === 'CLIENT' 
        ? currentUser.accountNumber 
        : document.getElementById('dep-account').value.trim();
    const amount = parseFloat(document.getElementById('dep-amount').value);

    const accounts = getAccounts();
    const acc = accounts.find(a => a.number === accNum);

    if (!acc || acc.status !== 'ATIVA') {
        alert('Conta não encontrada ou encerrada!');
        return;
    }

    acc.balance += amount;
    saveAccounts(accounts);
    addTransaction(accNum, 'DEPÓSITO', 'Depósito em Conta', amount);

    alert(`Depósito de ${formatMoney(amount)} realizado com sucesso na conta ${accNum}!`);
    this.reset();
});

// Saque
document.getElementById('form-withdraw').addEventListener('submit', function(e) {
    e.preventDefault();
    const accNum = currentUser.role === 'CLIENT' 
        ? currentUser.accountNumber 
        : document.getElementById('with-account').value.trim();
    const amount = parseFloat(document.getElementById('with-amount').value);

    const accounts = getAccounts();
    const acc = accounts.find(a => a.number === accNum);

    if (!acc || acc.status !== 'ATIVA') {
        alert('Conta não encontrada ou encerrada!');
        return;
    }

    if (acc.balance < amount) {
        alert('Saldo insuficiente para realizar este saque!');
        return;
    }

    acc.balance -= amount;
    saveAccounts(accounts);
    addTransaction(accNum, 'SAQUE', 'Saque em Terminal', amount);

    alert(`Saque de ${formatMoney(amount)} realizado com sucesso!`);
    this.reset();
});

// ==========================================
// EXTRATO E CARTÃO DO CLIENTE
// ==========================================

function renderStatement() {
    const accounts = getAccounts();
    const myAcc = accounts.find(a => a.number === currentUser.accountNumber);
    const transactions = getTransactions().filter(t => t.account === currentUser.accountNumber);

    document.getElementById('statement-balance').textContent = formatMoney(myAcc.balance);

    const tbody = document.getElementById('statement-table-body');
    tbody.innerHTML = transactions.slice().reverse().map(t => `
        <tr>
            <td>${t.date}</td>
            <td>${t.description}</td>
            <td>${t.type}</td>
            <td class="${t.type === 'DEPÓSITO' ? 'text-success' : 'text-danger'}">
                ${t.type === 'DEPÓSITO' ? '+' : '-'} ${formatMoney(t.amount)}
            </td>
        </tr>
    `).join('');
}

function renderClientCard() {
    const accounts = getAccounts();
    const myAcc = accounts.find(a => a.number === currentUser.accountNumber);
    const container = document.getElementById('client-card-container');

    container.innerHTML = `
        <div class="debit-card">
            <div class="card-top">
                <span class="bank-name">NovaBank</span>
                <span class="card-type">DÉBITO</span>
            </div>
            <div class="card-chip"></div>
            <div class="card-number">${myAcc.card.number}</div>
            <div class="card-bottom">
                <div>
                    <small>TITULAR</small>
                    <div>${myAcc.name.toUpperCase()}</div>
                </div>
                <div>
                    <small>VALIDADE</small>
                    <div>${myAcc.card.expiry}</div>
                </div>
                <div>
                    <small>CVV</small>
                    <div>${myAcc.card.cvv}</div>
                </div>
            </div>
        </div>
        <p style="margin-top:10px;"><strong>Agência:</strong> 0001 | <strong>Conta:</strong> ${myAcc.number}</p>
    `;
}

// ==========================================
// SIMULAÇÃO DE FINANCIAMENTO (TABELA PRICE)
// ==========================================

document.getElementById('form-loan').addEventListener('submit', function(e) {
    e.preventDefault();
    const P = parseFloat(document.getElementById('loan-amount').value);
    const n = parseInt(document.getElementById('loan-months').value);
    const i = parseFloat(document.getElementById('loan-rate').value) / 100;

    // Fórmula Tabela Price: PMT = P * [ i(1+i)^n ] / [ (1+i)^n - 1 ]
    const factor = Math.pow(1 + i, n);
    const installment = P * ((i * factor) / (factor - 1));
    const totalPaid = installment * n;
    const totalInterest = totalPaid - P;

    document.getElementById('res-loan-amount').textContent = formatMoney(P);
    document.getElementById('res-loan-installment').textContent = `${n}x de ${formatMoney(installment)}`;
    document.getElementById('res-loan-total').textContent = formatMoney(totalPaid);
    document.getElementById('res-loan-interest').textContent = formatMoney(totalInterest);

    document.getElementById('loan-result-box').style.display = 'block';
});

// ==========================================
// INICIALIZAÇÃO AO CARREGAR A PÁGINA
// ==========================================
initStorage();

const savedSession = sessionStorage.getItem(STORAGE_KEYS.SESSION);
if (savedSession) {
    currentUser = JSON.parse(savedSession);
    loadApp();
}
