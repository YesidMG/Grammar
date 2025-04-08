// Función para agregar una nueva regla de producción en la interfaz
export function agregarNuevaRegla() {
    const container = document.getElementById("reglasContainer");
    const div = document.createElement("div");
    div.classList.add("regla");

    // Crea un campo de texto para el lado izquierdo de la regla (no terminal)
    const inputIzq = document.createElement("input");
    inputIzq.type = "text";
    inputIzq.classList.add("izquierda");
    inputIzq.placeholder = "No terminal";

    // Crea un elemento de texto para la flecha "→"
    const flecha = document.createElement("span");
    flecha.innerText = "→";

    // Crea un campo de texto para el lado derecho de la regla (producción)
    const inputDer = document.createElement("input");
    inputDer.type = "text";
    inputDer.classList.add("derecha");
    inputDer.placeholder = "Producción";

    // Crea un botón para insertar el símbolo λ
    const botonLambda = document.createElement("button");
    botonLambda.type = "button";
    botonLambda.classList.add("btn-lambda");
    botonLambda.innerText = "λ";
    botonLambda.onclick = function () {
        inputDer.value += "λ"; // Inserta el símbolo λ en el campo de producción
        agregarNuevaRegla();
    };

    // Evento para agregar nueva regla
    inputDer.addEventListener("input", function () {
        if (this.value.trim() !== "" && container.lastChild === div) {
            agregarNuevaRegla();
        }
    });

    // Evento para eliminar regla vacía
    inputDer.addEventListener("blur", function () {
        if (this.value.trim() === "" && container.lastChild !== div) {
            container.removeChild(div);
        }
    });

    // Agrega los elementos creados al div de la regla
    div.appendChild(inputIzq);
    div.appendChild(flecha);
    div.appendChild(inputDer);
    div.appendChild(botonLambda); // Agrega el botón λ al div

    // Agrega el div de la regla al contenedor
    container.appendChild(div);
}