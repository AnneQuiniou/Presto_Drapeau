"use strict";

window.addEventListener("DOMContentLoaded", () => {
  //Element de la page
  const pageElements = {
    divLogin: document.getElementsByClassName("login")[0],
    pseudoField: document.getElementById("pseudo"),
    formSubmitEntry: document.getElementById("submitEntry"),
    btnSubmitEntry: document.getElementById("submitForm"),
  };

  const addWarning = (message) => {
    if (document.getElementsByClassName("warning").length != 0) {
      pageElements.divLogin.removeChild(
        document.getElementsByClassName("warning")[0]
      );
    }

    const pElement = document.createElement("p");
    pElement.className = "warning";
    pElement.innerText = message;
    pageElements.divLogin.appendChild(pElement);
  };

  // Verification du login
  pageElements.formSubmitEntry.addEventListener("submit", (event) => {
    console.log(event);

    if (pageElements.pseudoField.value == "") {
      event.preventDefault();
      addWarning("Choisissez un pseudo.");
    } else {
      if (
        pageElements.pseudoField.value.includes("<" || ">" || "@" || "{" || "}")
      ) {
        addWarning("Désolé, votre pseudo contient des signes interdits.");
        event.preventDefault();
      }
    }
  });

  const topElement = document.getElementById("top");

  topElement.addEventListener("click", () => {});
});
