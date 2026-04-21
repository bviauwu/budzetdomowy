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
