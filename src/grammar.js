import { agregarNuevaRegla } from './dom.js';

// Objeto para almacenar las reglas de la gramática
let gramatica = {};

// Variable para almacenar el símbolo inicial de la gramática
let simboloInicial = '';

// Función para procesar las reglas de la gramática ingresadas por el usuario
export function procesarGramatica() {
    gramatica = {};
    const reglas = document.querySelectorAll(".regla");
    const noTerminalesSet = new Set();
    
    // Primera pasada: recolectar no terminales
    reglas.forEach(regla => {
        const izq = regla.querySelector(".izquierda").value.trim();
        [...izq].forEach(char => {
            if (char.match(/[A-Z]/)) {
                noTerminalesSet.add(char);
            }
        });
    });

    // Procesar las reglas
    reglas.forEach((regla, index) => {
        const izq = regla.querySelector(".izquierda").value.trim();
        const der = regla.querySelector(".derecha").value.trim();

        if (izq && der) {
            if (!gramatica[izq]) {
                gramatica[izq] = [];
            }
            // Manejar producciones separadas por |
            if (der.includes("|")) {
                gramatica[izq].push(...der.split("|").map(p => p.trim()));
            } else {
                gramatica[izq].push(der);
            }
            if (index === 0) simboloInicial = izq;
        }
    });

    // Identifica los terminales
    const terminales = new Set();
    Object.values(gramatica).flat().forEach(produccion => {
        [...produccion].forEach(simbolo => {
            if (!noTerminalesSet.has(simbolo) && simbolo !== ' ') {
                terminales.add(simbolo);
            }
        });
    });

    // Mostrar resultados
    const tipo = determinarTipo();
    if (tipo === "Tipo 1") {
        alert("Solo se permiten gramáticas de tipo 2 o tipo 3");
        return;
    }

    document.getElementById("tipoGramatica").innerText = `Tipo de gramática: ${tipo}`;
    document.getElementById("terminales").value = `T={ ${[...terminales].join(", ") || ""} }`;
    document.getElementById("noTerminales").value = `NT={ ${[...noTerminalesSet].join(", ") || ""} }`;
    document.getElementById("simboloInicial").value = `S={ ${simboloInicial} }`;
}

// Función para determinar el tipo de gramática según la jerarquía de Chomsky
function determinarTipo() {
    let tipo = 2;
    let esRegularDerecha = true;
    let esRegularIzquierda = true;

    for (const izq in gramatica) {
        gramatica[izq].forEach(der => {
            // Para gramática regular derecha
            if (!der.match(/^[a-z]*[A-Z]?$/)) {
                esRegularDerecha = false;
            }
            // Para gramática regular izquierda
            if (!der.match(/^[A-Z]?[a-z]*$/)) {
                esRegularIzquierda = false;
            }
        });
    }

    if (esRegularDerecha || esRegularIzquierda) {
        tipo = 3;
    }

    return `Tipo ${tipo}`;
}

// Función para validar si una cadena pertenece al lenguaje generado por la gramática
export function validarCadena() {
    let cadena = document.getElementById("cadenaInput").value;
    // Si la entrada está vacía, tratarla como lambda
    if (cadena.trim() === "") cadena = " ";
    
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
    if (derivaciones.length > 0) {
        const arbol = derivaciones[0].map((paso, i) => {
            return ' '.repeat(i*2) + paso;
        }).join('\n');
        resultado.innerHTML = `<div class="arbol-derivacion">${arbol}</div>`;
    } else {
        resultado.innerHTML = "La cadena no pertenece al lenguaje.";
    }
}

// Función para generar cadenas de una longitud específica
export function generarCadenas() {
    const longitud = parseInt(document.getElementById("longitudInput").value);
    let generadas = new Set();

    function generarRecursivo(cadenaActual) {
        // Si la cadena actual tiene la longitud buscada y no tiene no terminales
        if (cadenaActual.length === longitud && ![...cadenaActual].some(c => /[A-Z]/.test(c))) {
            // Si es espacio o vacío, mostrar λ
            generadas.add(cadenaActual.trim() === "" ? "λ" : cadenaActual);
            return;
        }

        // Si la cadena es más larga que la longitud deseada, no seguimos
        if (cadenaActual.length > longitud) {
            return;
        }

        // Buscamos todas las posibles sustituciones
        let seHizoSustitucion = false;
        
        // Intentar todas las reglas de producción posibles
        for (const [izq, producciones] of Object.entries(gramatica)) {
            // Encontrar todas las ocurrencias del lado izquierdo
            let pos = -1;
            while ((pos = cadenaActual.indexOf(izq, pos + 1)) !== -1) {
                // Aplicar cada producción posible
                for (const produccion of producciones) {
                    const nuevaCadena = 
                        cadenaActual.substring(0, pos) + 
                        produccion + 
                        cadenaActual.substring(pos + izq.length);
                    
                    seHizoSustitucion = true;
                    generarRecursivo(nuevaCadena);
                }
            }
        }

        // Si no se pudo hacer ninguna sustitución y la cadena tiene no terminales
        // entonces esta rama no llevará a una cadena válida
        if (!seHizoSustitucion && cadenaActual.match(/[A-Z]/)) {
            return;
        }
    }

    // Comenzar la generación desde el símbolo inicial
    generarRecursivo(simboloInicial);

    // Mostrar resultados
    const resultado = document.getElementById("resultadoGeneracion");
    if (generadas.size > 0) {
        const cadenasOrdenadas = [...generadas].sort();
        resultado.innerHTML = cadenasOrdenadas
            .map(cadena => `<div class="cadena-generada">${cadena}</div>`)
            .join('');
        resultado.innerHTML += `<div class="total-cadenas">Total: ${generadas.size} cadenas</div>`;
    } else {
        resultado.innerHTML = "No es posible generar cadenas de esa longitud.";
    }
}

// Agregar función de limpieza
export function limpiarTodo() {
    // Limpiar campos de reglas
    const container = document.getElementById("reglasContainer");
    container.innerHTML = '';
    
    // Agregar una nueva regla vacía después de limpiar
    agregarNuevaRegla();

    // Limpiar resultados
    document.getElementById("terminales").value = '';
    document.getElementById("noTerminales").value = '';
    document.getElementById("simboloInicial").value = '';
    document.getElementById("tipoGramatica").innerText = '';
    document.getElementById("cadenaInput").value = '';
    document.getElementById("longitudInput").value = '';
    document.getElementById("resultadoValidacion").innerHTML = '';
    document.getElementById("resultadoGeneracion").innerHTML = '';
}
