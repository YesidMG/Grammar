// Objeto para almacenar las reglas de la gramática
let gramatica = {};

// Variable para almacenar el símbolo inicial de la gramática
let simboloInicial = '';

// Función para agregar una nueva regla de producción en la interfaz
function agregarNuevaRegla() {
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
    inputDer.addEventListener("input", function() {
        if (this.value.trim() !== "" && container.lastChild === div) {
            agregarNuevaRegla();
        }
    });

    // Evento para eliminar una regla si el campo de producción queda vacío y no es la última regla
    inputDer.addEventListener("blur", function() {
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

// Función para procesar las reglas de la gramática ingresadas por el usuario
function procesarGramatica() {
    // Reinicia el objeto de gramática
    gramatica = {};

    // Obtiene todas las reglas definidas en la interfaz
    const reglas = document.querySelectorAll(".regla");

    // Itera sobre cada regla para construir el objeto de gramática
    reglas.forEach((regla, index) => {
        const izq = regla.querySelector(".izquierda").value.trim(); // Lado izquierdo (no terminal)
        const der = regla.querySelector(".derecha").value.trim(); // Lado derecho (producción)

        // Si ambos lados tienen contenido, se agrega la regla a la gramática
        if (izq && der) {
            if (!gramatica[izq]) {
                gramatica[izq] = [];
            }
            // Divide las producciones separadas por "|" y las agrega
            gramatica[izq].push(...der.split("|"));

            // El primer no terminal se considera el símbolo inicial
            if (index === 0) simboloInicial = izq;
        }
    });

    // Identifica los terminales y no terminales
    const terminales = new Set();
    const noTerminales = new Set(Object.keys(gramatica));

    // Analiza las producciones para identificar terminales
    Object.values(gramatica).flat().forEach(produccion => {
        [...produccion].forEach(simbolo => {
            if (!noTerminales.has(simbolo)) {
                terminales.add(simbolo);
            }
        });
    });

    // Muestra los resultados en la interfaz
    document.getElementById("tipoGramatica").innerText = `Tipo de gramática: ${determinarTipo()}`;
    document.getElementById("terminales").value = `T={ ${[...terminales].join(", ") || ""} }`;
    document.getElementById("noTerminales").value = `NT={ ${[...noTerminales].join(", ") || ""} }`;
    document.getElementById("simboloInicial").value = `S={ ${simboloInicial} }`;
}

// Función para determinar el tipo de gramática según la jerarquía de Chomsky
function determinarTipo() {
    let tipo = 3; // Por defecto, se asume que es de tipo 3 (gramática regular)
    for (const izq in gramatica) {
        gramatica[izq].forEach(der => {
            // Si el lado izquierdo tiene más de un símbolo o el lado derecho tiene múltiples no terminales
            if (izq.length > 1 || /[A-Z].*[A-Z]/.test(der)) {
                tipo = 2; // Es de tipo 2 (gramática libre de contexto)
            }
        });
    }
    return `Tipo ${tipo}`;
}

// Función para validar si una cadena pertenece al lenguaje generado por la gramática
function validarCadena() {
    const cadena = document.getElementById("cadenaInput").value; // Cadena ingresada por el usuario
    let derivaciones = []; // Almacena las derivaciones posibles

    // Función recursiva para derivar la cadena
    function derivar(actual, pasos) {
        if (actual === cadena) {
            derivaciones.push(pasos.slice()); // Si se deriva la cadena, se guarda el camino
            return;
        }
        if (actual.length > cadena.length) return; // Si la longitud excede, se detiene

        // Intenta reemplazar no terminales con sus producciones
        for (const [izq, producciones] of Object.entries(gramatica)) {
            for (const prod of producciones) {
                if (actual.includes(izq)) {
                    const nuevo = actual.replace(izq, prod); // Reemplaza el no terminal
                    pasos.push(`${actual} → ${nuevo}`); // Guarda el paso
                    derivar(nuevo, pasos); // Llama recursivamente
                    pasos.pop(); // Elimina el paso actual al retroceder
                }
            }
        }
    }

    // Inicia la derivación desde el símbolo inicial
    derivar(simboloInicial, [`${simboloInicial}`]);

    // Muestra los resultados en la interfaz
    const resultado = document.getElementById("resultadoValidacion");
    resultado.innerHTML = derivaciones.length > 0 
        ? derivaciones.map(d => d.join(" → ")).join("<br>")
        : "La cadena no pertenece al lenguaje.";
}

// Función para generar cadenas de una longitud específica
function generarCadenas() {
    const longitud = parseInt(document.getElementById("longitudInput").value); // Longitud deseada
    let generadas = new Set(); // Almacena las cadenas generadas

    // Función recursiva para generar cadenas
    function generar(actual) {
        if (actual.length === longitud) {
            // Si la cadena tiene la longitud deseada y no contiene no terminales
            if (![...actual].some(c => gramatica[c])) {
                generadas.add(actual); // Agrega la cadena al conjunto
            }
            return;
        }
        if (actual.length > longitud) return; // Si excede la longitud, se detiene

        // Reemplaza no terminales con sus producciones
        for (const [izq, producciones] of Object.entries(gramatica)) {
            for (const prod of producciones) {
                if (actual.includes(izq)) {
                    generar(actual.replace(izq, prod)); // Llama recursivamente
                }
            }
        }
    }

    // Inicia la generación desde el símbolo inicial
    generar(simboloInicial);

    // Muestra los resultados en la interfaz
    const resultado = document.getElementById("resultadoGeneracion");
    resultado.innerHTML = generadas.size > 0 
        ? [...generadas].join(", ")
        : "No es posible generar una cadena de esa longitud.";
}

// Llama a la función para agregar la primera regla al cargar la página
window.onload = agregarNuevaRegla;