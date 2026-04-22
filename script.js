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
    const incomeList = document.getElementById("income-list");
    const expenseList = document.getElementById("expense-list");
    const totalEl = document.getElementById("total");
    const expensesEl = document.getElementById("expenses");
    const summary = document.getElementById("saldo");
    const noFundsAlert = document.getElementById("noFundsAlert");

    incomeList.innerHTML = "";
    expenseList.innerHTML = "";
    summary.innerHTML = "";

    let total = 0;
    let totalExpenses = 0;

    let perMember = {};

    transactions.slice().reverse().forEach(t => {
        const li = document.createElement("li");
        const prefix = t.type === "income" ? "+" : "-";

        li.innerHTML = `
            <span class="prefix-icon">${prefix}</span>
            <span class="amount-value">${t.amount}</span>
            <span class="transaction-desc">${t.desc}</span>
            <b class="transaction-member">[${t.member}]</b>
            <button onclick="remove(${t.id})">❌</button>
        `;

        if (t.type === "income") {
            incomeList.appendChild(li);
            total += t.amount;
            if (!perMember[t.member]) perMember[t.member] = 0;
            perMember[t.member] += t.amount;
        } else {
            expenseList.appendChild(li);
            total -= t.amount;
            totalExpenses += t.amount;
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

    for (let m in perMember) {
        const div = document.createElement("div");
        div.className = "member-box";
        div.textContent = `${m}: ${perMember[m].toFixed(2)}`;
        summary.appendChild(div);
    }
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
            desc: document.getElementById("desc").value,
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