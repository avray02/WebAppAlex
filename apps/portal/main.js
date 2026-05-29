(function () {
  const searchInput = document.querySelector("#app-search");
  const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
  const cards = Array.from(document.querySelectorAll(".app-card"));
  const emptyState = document.querySelector("#empty-state");
  let activeFilter = "all";

  function normalize(value) {
    return value.trim().toLowerCase();
  }

  function updateCards() {
    const query = normalize(searchInput.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesFilter =
        activeFilter === "all" || card.dataset.category === activeFilter;
      const matchesSearch = normalize(card.dataset.name || "").includes(query);
      const isVisible = matchesFilter && matchesSearch;

      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    emptyState.hidden = visibleCount > 0;
  }

  searchInput.addEventListener("input", updateCards);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

      updateCards();
    });
  });
})();
