function goToPage(target) {
  if (!target) return;
  window.location.href = target;
}

function bindPageNav() {
  const buttons = document.querySelectorAll("[data-go]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      goToPage(button.dataset.go);
    });
  });
}

bindPageNav();