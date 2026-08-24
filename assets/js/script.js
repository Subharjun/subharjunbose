'use strict';

/**
 * Portfolio interactions
 * - sidebar toggle (mobile)
 * - achievement modal
 * - portfolio filtering
 * - page navigation
 * - contact form (Formspree)
 */


// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const elementToggleFunc = function (elem) { elem.classList.toggle("active"); };


// ---------------------------------------------------------------------------
// sidebar
// ---------------------------------------------------------------------------

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener("click", function () {
    elementToggleFunc(sidebar);
    const isOpen = sidebar.classList.contains("active");
    this.setAttribute("aria-expanded", String(isOpen));
    this.querySelector("span").textContent = isOpen ? "Hide Contacts" : "Show Contacts";
  });
}


// ---------------------------------------------------------------------------
// achievement modal
// ---------------------------------------------------------------------------

const awardItems = document.querySelectorAll("[data-award-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

const modalIcon = document.querySelector("[data-modal-icon]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalMeta = document.querySelector("[data-modal-meta]");
const modalText = document.querySelector("[data-modal-text]");

// remembers what to focus again once the modal closes
let lastFocusedEl = null;

const openModal = function (item) {
  const icon = item.querySelector("[data-award-icon]");
  if (icon && modalIcon) modalIcon.setAttribute("name", icon.getAttribute("name"));

  modalTitle.textContent = item.querySelector("[data-award-title]").textContent;
  modalMeta.textContent = item.querySelector("[data-award-meta]").textContent;
  modalText.innerHTML = item.querySelector("[data-award-text]").innerHTML;

  lastFocusedEl = item;
  modalContainer.classList.add("active");
  overlay.classList.add("active");
  modalCloseBtn.focus();
};

const closeModal = function () {
  modalContainer.classList.remove("active");
  overlay.classList.remove("active");
  if (lastFocusedEl) lastFocusedEl.focus();
};

awardItems.forEach(function (item) {
  item.addEventListener("click", function (event) {
    // the card is role="button", but it can contain real links (session pages);
    // let those navigate instead of opening the modal
    if (event.target.closest("a")) return;
    openModal(this);
  });

  // keyboard parity: these cards are role="button", so Enter/Space must work
  item.addEventListener("keydown", function (event) {
    if (event.target.closest("a")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(this);
    }
  });
});

if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
if (overlay) overlay.addEventListener("click", closeModal);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && modalContainer && modalContainer.classList.contains("active")) {
    closeModal();
  }
});


// ---------------------------------------------------------------------------
// portfolio filtering
// ---------------------------------------------------------------------------

const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

// match on explicit data values, never on visible label text, so renaming a
// filter button can never silently break filtering
const filterFunc = function (selectedValue) {
  filterItems.forEach(function (item) {
    if (selectedValue === "all" || selectedValue === item.dataset.category) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
};

if (select) {
  select.addEventListener("click", function () {
    elementToggleFunc(this);
    this.setAttribute("aria-expanded", String(this.classList.contains("active")));
  });
}

selectItems.forEach(function (item) {
  item.addEventListener("click", function () {
    if (selectValue) selectValue.textContent = this.textContent;
    if (select) {
      select.classList.remove("active");
      select.setAttribute("aria-expanded", "false");
    }
    filterFunc(this.dataset.filterValue);

    // keep the large-screen button row in sync with the mobile dropdown
    filterBtn.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.filterValue === item.dataset.filterValue);
    });
  });
});

filterBtn.forEach(function (btn) {
  btn.addEventListener("click", function () {
    if (selectValue) selectValue.textContent = this.textContent;
    filterFunc(this.dataset.filterValue);

    filterBtn.forEach(function (other) { other.classList.remove("active"); });
    this.classList.add("active");
  });
});


// ---------------------------------------------------------------------------
// page navigation
// ---------------------------------------------------------------------------

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

const showPage = function (target) {
  pages.forEach(function (page) {
    page.classList.toggle("active", page.dataset.page === target);
  });

  navigationLinks.forEach(function (link) {
    const isCurrent = link.dataset.navTarget === target;
    link.classList.toggle("active", isCurrent);
    // aria-current tells screen readers which page is showing
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  window.scrollTo(0, 0);
};

navigationLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    const target = this.dataset.navTarget;
    showPage(target);
    // deep-linkable and back-button friendly
    history.replaceState(null, "", "#" + target);
  });
});

// honour a #hash on load so shared links land on the right page
const initialPage = window.location.hash.replace("#", "");
if (initialPage && document.querySelector('[data-page="' + initialPage + '"]')) {
  showPage(initialPage);
}


// ---------------------------------------------------------------------------
// contact form
// ---------------------------------------------------------------------------

const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");
const formStatus = document.querySelector("[data-form-status]");

formInputs.forEach(function (input) {
  input.addEventListener("input", function () {
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
});

if (form) {
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    formBtn.setAttribute("disabled", "");
    formStatus.textContent = "Sending…";
    formStatus.className = "form-status is-pending";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        form.reset();
        formStatus.textContent = "Thanks — your message is on its way.";
        formStatus.className = "form-status is-success";
      } else {
        throw new Error("Request failed");
      }
    } catch (error) {
      formStatus.textContent = "Something went wrong. Email me directly at subharjun.bose2805@gmail.com.";
      formStatus.className = "form-status is-error";
      formBtn.removeAttribute("disabled");
    }
  });
}
