let transactions = JSON.parse(localStorage.getItem("budget")) || [];
let members = JSON.parse(localStorage.getItem("members")) || [];
let currentModalTransactionId = null;

function save() {
    localStorage.setItem("budget", JSON.stringify(transactions));
    localStorage.setItem("members", JSON.stringify(members));
}

function renderMembersSelect() {
    const select = document.getElementById("member");
    select.innerHTML = "";

    members.forEach(m => {
        const option = document.createElement("option");
        option.value = m;
        option.textContent = m;
        select.appendChild(option);
    });
}

function addMember() {
    const name = document.getElementById("memberName").value.trim();
    if (!name) return;

    if (!members.includes(name)) {
        members.push(name);
        save();
        renderMembersSelect();
    }

    document.getElementById("memberName").value = "";
}

// tu mi pomogl czat bo bylo trudne
function render() {
    const incomeContainer = document.getElementById("income-list");
    const expenseContainer = document.getElementById("expense-list");
    const totalEl = document.getElementById("total");
    const expensesEl = document.getElementById("expenses");
    const summary = document.getElementById("saldo");
    const categoriesSummary = document.getElementById("categories-summary");
    const noFundsAlert = document.getElementById("noFundsAlert");

    incomeContainer.innerHTML = "";
    expenseContainer.innerHTML = "";
    summary.innerHTML = "";
    categoriesSummary.innerHTML = "";

    let total = 0;
    let totalExpenses = 0;
    let perMember = {};
    
    const categories = ["Impreza", "Jedzenie", "Zachcianka", "Alkohol", "Narkotyki", "Papierosy", "Dom", "Auto", "Wakacje"];
    
    // Organizuj transakcje po tipie i kategorii
    let incomeByCategory = {};
    let expenseByCategory = {};
    let allByCategory = {};
    
    categories.forEach(cat => {
        incomeByCategory[cat] = [];
        expenseByCategory[cat] = [];
        allByCategory[cat] = [];
    });
    
    // Add "Inne" category for transactions without category
    incomeByCategory["Inne"] = [];
    expenseByCategory["Inne"] = [];
    allByCategory["Inne"] = [];

    transactions.slice().reverse().forEach(t => {
        const cat = t.category || "Inne";
        
        if (t.type === "income") {
            total += t.amount;
            if (!incomeByCategory[cat]) incomeByCategory[cat] = [];
            incomeByCategory[cat].push(t);
            if (!allByCategory[cat]) allByCategory[cat] = [];
            allByCategory[cat].push(t);
            if (!perMember[t.member]) perMember[t.member] = 0;
            perMember[t.member] += t.amount;
        } else {
            total -= t.amount;
            totalExpenses += t.amount;
            if (!expenseByCategory[cat]) expenseByCategory[cat] = [];
            expenseByCategory[cat].push(t);
            if (!allByCategory[cat]) allByCategory[cat] = [];
            allByCategory[cat].push(t);
            if (!perMember[t.member]) perMember[t.member] = 0;
            perMember[t.member] -= t.amount;
        }
    });

    totalEl.textContent = total.toFixed(2);
    expensesEl.textContent = totalExpenses.toFixed(2);

    // Wyświetl powiadomienie jeśli saldo wynosi 0
    if (total === 0) {
        noFundsAlert.style.display = "block";
    } else {
        noFundsAlert.style.display = "none";
    }

    // Render income categories
    categories.forEach(cat => {
        if (incomeByCategory[cat].length > 0) {
            const categoryDiv = createCategoryTable(cat, incomeByCategory[cat], "income");
            incomeContainer.appendChild(categoryDiv);
        }
    });
    
    // Render "Inne" category if has transactions
    if (incomeByCategory["Inne"].length > 0) {
        const categoryDiv = createCategoryTable("Inne", incomeByCategory["Inne"], "income");
        incomeContainer.appendChild(categoryDiv);
    }

    // Render expense categories
    categories.forEach(cat => {
        if (expenseByCategory[cat].length > 0) {
            const categoryDiv = createCategoryTable(cat, expenseByCategory[cat], "expense");
            expenseContainer.appendChild(categoryDiv);
        }
    });
    
    // Render "Inne" category if has transactions
    if (expenseByCategory["Inne"].length > 0) {
        const categoryDiv = createCategoryTable("Inne", expenseByCategory["Inne"], "expense");
        expenseContainer.appendChild(categoryDiv);
    }

    // Render categories summary at the bottom
    categories.forEach(cat => {
        if (allByCategory[cat].length > 0) {
            const categoryDiv = createCategorySummaryBox(cat, allByCategory[cat]);
            categoriesSummary.appendChild(categoryDiv);
        }
    });
    
    // Render "Inne" category if has transactions
    if (allByCategory["Inne"].length > 0) {
        const categoryDiv = createCategorySummaryBox("Inne", allByCategory["Inne"]);
        categoriesSummary.appendChild(categoryDiv);
    }

    for (let m in perMember) {
        const div = document.createElement("div");
        div.className = "member-box";
        div.textContent = `${m}: ${perMember[m].toFixed(2)}`;
        summary.appendChild(div);
    }
    
    // Wyświetl statystyki
    renderSpendingAnalysis();
     setTimeout(renderChart, 0);
}

function createCategoryTable(categoryName, transactions, type) {
    const wrapper = document.createElement("div");
    wrapper.className = "category-section";
    
    let categoryTotal = 0;
    transactions.forEach(t => {
        if (type === "income") {
            categoryTotal += t.amount;
        } else {
            categoryTotal -= t.amount;
        }
    });
    
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.textContent = `${categoryName} - ${Math.abs(categoryTotal).toFixed(2)} PLN`;
    wrapper.appendChild(categoryHeader);
    
    const ul = document.createElement("ul");
    ul.className = "category-list";
    
    transactions.forEach(t => {
        const li = document.createElement("li");
        const prefix = t.type === "income" ? "+" : "-";
        const commentCount = t.comments ? t.comments.length : 0;

        li.innerHTML = `
            <span class="prefix-icon">${prefix}</span>
            <span class="amount-value">${t.amount}</span>
            <span class="transaction-desc">${t.desc}</span>
            <b class="transaction-member">[${t.member}]</b>
            <button class="comment-btn" onclick="openCommentModal(${t.id})" title="Komentarze i reactions">💬${commentCount > 0 ? ' ' + commentCount : ''}</button>
            <button onclick="remove(${t.id})">❌</button>
        `;
        
        ul.appendChild(li);
    });
    
    wrapper.appendChild(ul);
    return wrapper;
}

function createCategorySummaryBox(categoryName, transactions) {
    const wrapper = document.createElement("div");
    wrapper.className = "category-summary-box";
    
    let categoryTotal = 0;
    let incomeSum = 0;
    let expenseSum = 0;
    
    transactions.forEach(t => {
        if (t.type === "income") {
            incomeSum += t.amount;
            categoryTotal += t.amount;
        } else {
            expenseSum += t.amount;
            categoryTotal -= t.amount;
        }
    });
    
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "summary-header";
    const totalSign = categoryTotal >= 0 ? "+" : "";
    categoryHeader.innerHTML = `
        <div class="summary-title">${categoryName}</div>
        <div class="summary-stats">
            Wpłaty: <span class="income-sum">+${incomeSum.toFixed(2)}</span> | 
            Wydatki: <span class="expense-sum">-${expenseSum.toFixed(2)}</span> | 
            Razem: <span class="total-sum">${totalSign}${categoryTotal.toFixed(2)}</span>
        </div>
    `;
    wrapper.appendChild(categoryHeader);
    
    const ul = document.createElement("ul");
    ul.className = "summary-list";
    
    transactions.forEach(t => {
        const li = document.createElement("li");
        const prefix = t.type === "income" ? "+" : "-";
        const commentCount = t.comments ? t.comments.length : 0;

        li.innerHTML = `
            <span class="prefix-icon">${prefix}</span>
            <span class="amount-value">${t.amount}</span>
            <span class="transaction-desc">${t.desc}</span>
            <b class="transaction-member">[${t.member}]</b>
            <button class="comment-btn" onclick="openCommentModal(${t.id})" title="Komentarze i reactions">💬${commentCount > 0 ? ' ' + commentCount : ''}</button>
            <button onclick="remove(${t.id})">❌</button>
        `;
        
        ul.appendChild(li);
    });
    
    wrapper.appendChild(ul);
    return wrapper;
}

function remove(id) {
    transactions = transactions.filter(t => t.id !== id);
    save();
    render();
}

// Komentarze i reactions
function openCommentModal(transactionId) {
    currentModalTransactionId = transactionId;
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) return;
    
    // Inicjalizuj strukturę jeśli nie istnieje
    if (!transaction.comments) transaction.comments = [];
    if (!transaction.reactions) transaction.reactions = {};
    
    // Wyświetl info o transakcji
    const infoDiv = document.getElementById("modal-transaction-info");
    const prefix = transaction.type === "income" ? "+" : "-";
    infoDiv.innerHTML = `
        <div class="transaction-info">
            <p><strong>${transaction.member}</strong> - ${transaction.desc}</p>
            <p>${prefix}${transaction.amount} PLN (${transaction.category})</p>
        </div>
    `;
    
    // Wyświetl reactions
    renderReactions(transaction);
    
    // Wyświetl komentarze
    renderComments(transaction);
    
    document.getElementById("commentModal").style.display = "block";
}

function closeCommentModal() {
    document.getElementById("commentModal").style.display = "none";
    currentModalTransactionId = null;
}

function addReaction(emoji) {
    const transaction = transactions.find(t => t.id === currentModalTransactionId);
    if (!transaction) return;
    
    if (!transaction.reactions) transaction.reactions = {};
    if (!transaction.reactions[emoji]) {
        transaction.reactions[emoji] = 0;
    }
    transaction.reactions[emoji]++;
    
    save();
    renderReactions(transaction);
    render();
}

function renderReactions(transaction) {
    const reactionsDisplay = document.getElementById("reactions-display");
    reactionsDisplay.innerHTML = "";
    
    if (transaction.reactions && Object.keys(transaction.reactions).length > 0) {
        const reactionsDiv = document.createElement("div");
        reactionsDiv.className = "reactions-summary";
        
        Object.entries(transaction.reactions).forEach(([emoji, count]) => {
            const span = document.createElement("span");
            span.className = "reaction-count";
            span.textContent = `${emoji} ${count}`;
            reactionsDiv.appendChild(span);
        });
        
        reactionsDisplay.appendChild(reactionsDiv);
    }
}

function addComment() {
    const commentInput = document.getElementById("commentInput");
    const commentText = commentInput.value.trim();
    
    if (!commentText) return;
    
    const transaction = transactions.find(t => t.id === currentModalTransactionId);
    if (!transaction) return;
    
    if (!transaction.comments) transaction.comments = [];
    
    transaction.comments.push({
        text: commentText,
        timestamp: new Date().toLocaleString()
    });
    
    commentInput.value = "";
    save();
    renderComments(transaction);
    render();
}

function renderComments(transaction) {
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = "";
    
    if (transaction.comments && transaction.comments.length > 0) {
        transaction.comments.forEach(comment => {
            const div = document.createElement("div");
            div.className = "comment-item";
            div.innerHTML = `
                <p class="comment-text">${comment.text}</p>
                <small class="comment-time">${comment.timestamp}</small>
            `;
            commentsList.appendChild(div);
        });
    } else {
        commentsList.innerHTML = "<p style='color: #888;'>Brak komentarzy</p>";
    }
}

// Statystyki
function renderSpendingAnalysis() {
    const analysisDiv = document.getElementById("spending-analysis");
    analysisDiv.innerHTML = "";
    
    if (members.length === 0) {
        analysisDiv.innerHTML = "<p>Brak członków rodziny</p>";
        return;
    }
    
    // Obliczenia
    let memberStats = {};
    members.forEach(member => {
        memberStats[member] = {
            totalIncome: 0,
            totalExpense: 0,
            byCategory: {}
        };
    });
    
    transactions.forEach(t => {
        if (t.type === "income") {
            memberStats[t.member].totalIncome += t.amount;
        } else {
            memberStats[t.member].totalExpense += t.amount;
            if (!memberStats[t.member].byCategory[t.category]) {
                memberStats[t.member].byCategory[t.category] = 0;
            }
            memberStats[t.member].byCategory[t.category] += t.amount;
        }
    });
    
    // Ranking wydatków
    const spendingRanking = members
        .map(m => ({
            member: m,
            spending: memberStats[m].totalExpense,
            balance: memberStats[m].totalIncome - memberStats[m].totalExpense
        }))
        .sort((a, b) => b.spending - a.spending);
    
    // Karty statystyk
    const statsContainer = document.createElement("div");
    statsContainer.className = "stats-container";
    
    spendingRanking.forEach((stat, index) => {
        const card = document.createElement("div");
        card.className = "stat-card";
        
        // Określ czy to darmozjad
        const isDarmozjad = stat.balance < 0 && Math.abs(stat.balance) > 100;
        const cardClass = isDarmozjad ? "darmozjad" : "";
        
        card.innerHTML = `
            <div class="stat-header">
                <h3>${index + 1}. ${stat.member}</h3>
                <span class="stat-ranking">${isDarmozjad ? "🎩 Darmozjad" : "👤"}</span>
            </div>
            <div class="stat-info">
                <p>💰 Wpłaty: <strong>+${memberStats[stat.member].totalIncome.toFixed(2)}</strong></p>
                <p>💸 Wydatki: <strong>-${stat.spending.toFixed(2)}</strong></p>
                <p>📊 Saldo: <span class="${stat.balance >= 0 ? 'positive' : 'negative'}"><strong>${stat.balance >= 0 ? "+" : ""}${stat.balance.toFixed(2)}</strong></span></p>
            </div>
            <div class="category-breakdown">
                <h4>Wydatki po kategoriach:</h4>
                ${Object.entries(memberStats[stat.member].byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => `<p>• ${cat}: <strong>-${amount.toFixed(2)} PLN</strong></p>`)
                    .join("")}
            </div>
        `;
        
        statsContainer.appendChild(card);
    });
    
    analysisDiv.appendChild(statsContainer);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("form").addEventListener("submit", e => {
        e.preventDefault();

        const amount = parseFloat(document.getElementById("amount").value);
        const type = document.getElementById("type").value;
        const member = document.getElementById("member").value;
        const category = document.getElementById("category").value;
        let desc = document.getElementById("desc").value.trim();

        // Ustaw domyślny opis jeśli jest pusty
        if (!desc) {
            desc = type === "income" ? "Wpłata" : "Wydatek";
        }

        let currentTotal = 0;
        transactions.forEach(t => {
            if (t.type === "income") {
                currentTotal += t.amount;
            } else {
                currentTotal -= t.amount;
            }
        });

        if (type === "expense" && amount > currentTotal) {
            alert("⚠️ Nie można dokonywać wypłat! Kwota wydatku (" + amount.toFixed(2) + " PLN) przekracza dostępne saldo (" + currentTotal.toFixed(2) + " PLN).");
            return;
        }

        const newT = {
            id: Date.now(),
            amount: amount,
            type: type,
            desc: desc,
            category: category,
            member: member
        };

        transactions.push(newT);

        save();
        render();
        e.target.reset();
    });

    renderMembersSelect();
    render();
    
    // Zamknij modal jeśli klikniemy na tło
    document.getElementById("commentModal").addEventListener("click", function(e) {
        if (e.target === this) {
            closeCommentModal();
        }
    });
});
let chartInstance = null;

function renderChart() {
    const canvas = document.getElementById("spendingChart");
    
    // 🔴 jeśli canvas nie istnieje → przerwij
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let spendingPerMember = {};

    members.forEach(m => spendingPerMember[m] = 0);

    transactions.forEach(t => {
        if (t.type === "expense") {
            spendingPerMember[t.member] += t.amount;
        }
    });

    const labels = Object.keys(spendingPerMember);
    const data = Object.values(spendingPerMember);

    // 🔴 jeśli brak danych → nie rysuj pustego wykresu
    if (data.length === 0) return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Wydatki (PLN)",
                data: data,
                backgroundColor: "rgba(255, 51, 51, 0.6)",
                borderColor: "#ff3333",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { ticks: { color: "white" }},
                y: { ticks: { color: "white" }}
            }
        }
    });
}
