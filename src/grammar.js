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

    if (reglas.length == 1) {
        alert("Por favor, agregue al menos una regla de producción antes de procesar la gramática.");
        return;
    }

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
        // Verificar si el lado izquierdo tiene más de un símbolo (no es tipo 2)
        if (!izq.match(/^[A-Z]$/)) {
            alert("La gramática no cumple con las reglas de tipo 2 o tipo 3.");
            return "No válida";
        }

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

    if (esRegularDerecha) {
        tipo = '3 (Regular Derecha)';
    }else if (esRegularIzquierda){
        tipo = '3 (Regular Izquierda)';
    }

    return `Tipo ${tipo}`;
}

// Función para validar si una cadena pertenece al lenguaje generado por la gramática
export function validarCadena() {

     // Verificar si la gramática está procesada
     if (Object.keys(gramatica).length === 0 || !simboloInicial) {
        alert("Por favor, agregue y procese una gramática antes de validar cadenas.");
        return;
    }

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

     // Verificar si la gramática está procesada
     if (Object.keys(gramatica).length === 0 || !simboloInicial) {
        alert("Por favor, agregue y procese una gramática antes de generar cadenas.");
        return;
    }

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

// Función para guardar la gramática en un archivo
export function guardarGramatica() {

    // Obtener los datos de los campos
    const terminales = document.getElementById("terminales").value;
    const noTerminales = document.getElementById("noTerminales").value;
    const simboloInicial = document.getElementById("simboloInicial").value;
    const tipoGramatica = document.getElementById("tipoGramatica").innerText;

    // Verificar si la gramática está procesada
     if (Object.keys(gramatica).length === 0 || !simboloInicial) {
        alert("Por favor, agregue y procese una gramática antes de guardar la gramatica.");
        return;
    }

    // Crear las reglas de producción en formato legible
    let reglasProduccion = "Reglas de Producción:\n";
    for (const [izq, producciones] of Object.entries(gramatica)) {
        reglasProduccion += `${izq} → ${producciones.join(" | ")}\n`;
    }

    // Crear el contenido del archivo
    const contenido = `
        Terminales: ${terminales}
        No Terminales: ${noTerminales}
        Símbolo Inicial: ${simboloInicial}
        Tipo de Gramática: ${tipoGramatica}

        ${reglasProduccion}
    `.trim();

    // Crear un blob con el contenido
    const blob = new Blob([contenido], { type: "text/plain" });

    // Crear un enlace para descargar el archivo
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "gramatica.dcy"; // Nombre del archivo
    enlace.click();

    // Liberar el objeto URL
    URL.revokeObjectURL(enlace.href);
}

// Función para cargar un archivo y definir la gramática
export function cargarArchivo() {
    const archivoInput = document.getElementById("cargar-archivo");
    const archivo = archivoInput.files[0];

    if (!archivo) {
        alert("Por favor, selecciona un archivo.");
        return;
    }

    const lector = new FileReader();

    lector.onload = function (evento) {
        const contenido = evento.target.result;

        // Procesar el contenido del archivo
        const lineas = contenido.split("\n").map(linea => linea.trim());
        const terminalesLinea = lineas.find(linea => linea.startsWith("Terminales:"));
        const noTerminalesLinea = lineas.find(linea => linea.startsWith("No Terminales:"));
        const simboloInicialLinea = lineas.find(linea => linea.startsWith("Símbolo Inicial:"));
        const reglasInicio = lineas.findIndex(linea => linea.startsWith("Reglas de Producción:"));

        if (!terminalesLinea || !noTerminalesLinea || !simboloInicialLinea || reglasInicio === -1) {
            alert("El archivo no tiene el formato esperado.");
            return;
        }

        // Extraer los datos del archivo
        const terminales = terminalesLinea.replace("Terminales:", "").trim().split(", ");
        const noTerminales = noTerminalesLinea.replace("No Terminales:", "").trim().split(", ");
        const simboloInicial = simboloInicialLinea.replace("Símbolo Inicial:", "").trim();

        // Extraer las reglas de producción
        const reglas = lineas.slice(reglasInicio + 1).filter(linea => linea.includes("→"));
        gramatica = {}; // Reiniciar el objeto de gramática
        reglas.forEach(regla => {
            const [izq, der] = regla.split("→").map(parte => parte.trim());
            if (!gramatica[izq]) {
                gramatica[izq] = [];
            }
            gramatica[izq].push(...der.split("|").map(p => p.trim()));
        });

        // Actualizar los campos en la interfaz
        document.getElementById("terminales").value = terminales.join(", ");
        document.getElementById("noTerminales").value = noTerminales.join(", ");
        document.getElementById("simboloInicial").value = simboloInicial;

        // Actualizar las reglas en el HTML
        const reglasContainer = document.getElementById("reglasContainer");
        reglasContainer.innerHTML = ""; // Limpiar las reglas actuales
        for (const [izq, producciones] of Object.entries(gramatica)) {
            producciones.forEach(produccion => {
                const reglaHTML = `
                    <div class="regla">
                        <input type="text" class="izquierda" value="${izq}">
                        <span>→</span>
                        <input type="text" class="derecha" value="${produccion}">
                    </div>
                `;
                reglasContainer.innerHTML += reglaHTML;
            });
        }

        procesarGramatica() // Procesar la gramática cargada
        agregarNuevaRegla(); // Agregar una nueva regla vacía al final
        alert("Gramática cargada correctamente.");
    };

    lector.onerror = function () {
        alert("Hubo un error al leer el archivo.");
    };

    lector.readAsText(archivo);
}