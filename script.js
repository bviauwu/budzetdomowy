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
    const list = document.getElementById("list");
    const totalEl = document.getElementById("total");
    const expensesEl = document.getElementById("expenses");
    const summary = document.getElementById("membersSummary");

    list.innerHTML = "";
    summary.innerHTML = "";

    let total = 0;
    let totalExpenses = 0;

    let perMember = {};

    transactions.slice().reverse().forEach(t => {
        const li = document.createElement("li");

        li.className = t.type;

        li.innerHTML = `
            ${t.amount} (${t.type}) - ${t.desc} 
            <b>[${t.member}]</b>
            <button onclick="remove(${t.id})">❌</button>
        `;

        list.appendChild(li);

        if (!perMember[t.member]) perMember[t.member] = 0;

        if (t.type === "income") {
            total += t.amount;
            perMember[t.member] += t.amount;
        } else {
            total -= t.amount;
            totalExpenses += t.amount;
            perMember[t.member] -= t.amount;
        }
    });

    totalEl.textContent = total.toFixed(2);
    expensesEl.textContent = totalExpenses.toFixed(2);

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
