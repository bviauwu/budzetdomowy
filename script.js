let transactions = JSON.parse(localStorage.getItem("budget")) || [];
let members = JSON.parse(localStorage.getItem("members")) || [];

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

        li.innerHTML = `
            <span class="prefix-icon">${prefix}</span>
            <span class="amount-value">${t.amount}</span>
            <span class="transaction-desc">${t.desc}</span>
            <b class="transaction-member">[${t.member}]</b>
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

        li.innerHTML = `
            <span class="prefix-icon">${prefix}</span>
            <span class="amount-value">${t.amount}</span>
            <span class="transaction-desc">${t.desc}</span>
            <b class="transaction-member">[${t.member}]</b>
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
});