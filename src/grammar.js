// Objeto para almacenar las reglas de la gramática
let gramatica = {};

// Variable para almacenar el símbolo inicial de la gramática
let simboloInicial = '';

// Función para procesar las reglas de la gramática ingresadas por el usuario
export function procesarGramatica() {
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

    const tipo = determinarTipo();

    if (tipo === "Tipo 1") {
        alert("Solo se permiten gramáticas de tipo 2 o tipo 3");
        return;
    }

    document.getElementById("tipoGramatica").innerText = `Tipo de gramática: ${determinarTipo()}`;
    document.getElementById("terminales").value = `T={ ${[...terminales].join(", ") || ""} }`;
    document.getElementById("noTerminales").value = `NT={ ${[...noTerminales].join(", ") || ""} }`;
    document.getElementById("simboloInicial").value = `S={ ${simboloInicial} }`;
}

// Función para determinar el tipo de gramática según la jerarquía de Chomsky
// function determinarTipo() {
//     let tipo = 3; // Por defecto, se asume que es de tipo 3 (gramática regular)
//     for (const izq in gramatica) {
//         gramatica[izq].forEach(der => {
//             // Si el lado izquierdo tiene más de un símbolo o el lado derecho tiene múltiples no terminales
//             if (izq.length > 1 || /[A-Z].*[A-Z]/.test(der)) {
//                 tipo = 2; // Es de tipo 2 (gramática libre de contexto)
//             }
//         });
//     }
//     return `Tipo ${tipo}`;
// }

function determinarTipo() {
    // Por defecto, asumimos Tipo 0 (gramática irrestricta)
    let tipo = 0;

    // Conjuntos de no terminales y terminales
    const noTerminales = new Set(Object.keys(gramatica));
    const terminales = new Set();

    // Identificar terminales a partir de las producciones
    for (const izq in gramatica) {
        for (const der of gramatica[izq]) {
            for (const simbolo of der) {
                if (!noTerminales.has(simbolo) && simbolo !== 'ε') {
                    terminales.add(simbolo);
                }
            }
        }
    }

    // Verificar gramática sensible al contexto (Tipo 1)
    let esTipo1 = true;
    for (const izq in gramatica) {
        for (const der of gramatica[izq]) {
            // Permitir producción vacía solo si es el símbolo inicial
            if (der === 'ε' || der === '') {
                if (izq !== simboloInicial) {
                    esTipo1 = false;
                    break;
                }
                continue;
            }
            // En gramáticas sensibles al contexto, la longitud de der debe ser mayor o igual a la de izq
            if (der.length < izq.length) {
                esTipo1 = false;
                break;
            }
        }
        if (!esTipo1) break;
    }

    if (!esTipo1) {
        // Si no cumple las restricciones de Tipo 1, se considera Tipo 0
        return `Tipo ${tipo}`;
    } else {
        tipo = 1;
    }

    // Verificar gramática libre de contexto (Tipo 2)
    // En este tipo, cada regla debe tener un único no terminal en el lado izquierdo
    let esTipo2 = true;
    for (const izq in gramatica) {
        if (izq.length !== 1) {
            esTipo2 = false;
            break;
        }
    }
    if (!esTipo2) {
        return `Tipo ${tipo}`; // Sigue siendo Tipo 1
    } else {
        tipo = 2;
    }

    // Verificar gramática regular (Tipo 3)
    // Se evalúa si es regular por la derecha o por la izquierda (no se permiten mezclas)
    let esRegularDerecha = true;
    let esRegularIzquierda = true;

    // Suponiendo que:
    // - Terminales: letras minúsculas (a-z)
    // - No terminales: letras mayúsculas (A-Z)
    // Para gramática regular derecha, la producción debe ser: una o más terminales, opcionalmente seguidas de un único no terminal
    const formatoDerecha = /^[a-z]+([A-Z])?$/;
    // Para gramática regular izquierda, la producción debe ser: un opcional no terminal seguido de una o más terminales
    const formatoIzquierda = /^([A-Z])?[a-z]+$/;

    for (const izq in gramatica) {
        for (const der of gramatica[izq]) {
            // La producción vacía solo se permite en el símbolo inicial
            if (der === 'ε' || der === '') {
                if (izq !== simboloInicial) {
                    esRegularDerecha = false;
                    esRegularIzquierda = false;
                    break;
                }
                continue;
            }
            if (!formatoDerecha.test(der)) {
                esRegularDerecha = false;
            }
            if (!formatoIzquierda.test(der)) {
                esRegularIzquierda = false;
            }
        }
    }

    // Se considera regular si cumple de forma consistente alguna de las dos (derecha o izquierda)
    if (esRegularDerecha || esRegularIzquierda) {
        tipo = 3;
    }

    return `Tipo ${tipo}`;
}


// Función para validar si una cadena pertenece al lenguaje generado por la gramática
export function validarCadena() {
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
export function generarCadenas() {
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
