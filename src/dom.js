// Función para agregar una nueva regla de producción en la interfaz
export function agregarNuevaRegla() {
    // Obtiene el contenedor donde se agregarán las reglas
    const container = document.getElementById("reglasContainer");

    // Crea un nuevo div para representar una regla
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

    // Evento para agregar una nueva regla automáticamente si el usuario comienza a escribir en la última regla
    inputDer.addEventListener("input", function () {
        if (this.value.trim() !== "" && container.lastChild === div) {
            agregarNuevaRegla();
        }
    });

    // Evento para eliminar una regla si el campo de producción queda vacío y no es la última regla
    inputDer.addEventListener("blur", function () {
        if (this.value.trim() === "" && container.lastChild !== div) {
            container.removeChild(div);
        }
    });

    // Agrega los elementos creados al div de la regla
    div.appendChild(inputIzq);
    div.appendChild(flecha);
    div.appendChild(inputDer);

    // Agrega el div de la regla al contenedor
    container.appendChild(div);
}