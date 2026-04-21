const form = document.getElementById("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        amount: form.amount.value,
        type: form.type.value,
        description: form.description.value
    };

    await fetch("add.php", {
        method: "POST",
        body: JSON.stringify(data)
    });

    location.reload();
});