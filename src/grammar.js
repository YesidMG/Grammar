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
        let der = regla.querySelector(".derecha").value.trim();

        if (izq && der) {
            if (!gramatica[izq]) {
                gramatica[izq] = [];
            }

            // Manejar producciones separadas por |
            if (der.includes("|")) {
                const producciones = der.split("|").map(p => p.trim());
                producciones.forEach(prod => {
                    // Si la producción es λ, agregar cadena vacía
                    if (prod === 'λ') {
                        gramatica[izq].push('');
                    } else {
                        // Eliminar cualquier λ que aparezca en la producción
                        gramatica[izq].push(prod.replace(/λ/g, ''));
                    }
                });
            } else {
                // Si la producción es λ, agregar cadena vacía
                if (der === 'λ') {
                    gramatica[izq].push('');
                } else {
                    // Eliminar cualquier λ que aparezca en la producción
                    gramatica[izq].push(der.replace(/λ/g, ''));
                }
            }
            if (index === 0) simboloInicial = izq;
        }
    });

    // Identifica los terminales (excluyendo λ y espacios vacíos)
    const terminales = new Set();
    Object.values(gramatica).flat().forEach(produccion => {
        [...produccion].forEach(simbolo => {
            if (!noTerminalesSet.has(simbolo) && 
                simbolo !== ' ' && 
                simbolo !== 'λ' && 
                simbolo !== '') {
                terminales.add(simbolo);
            }
        });
    });

    // Mostrar resultados
    const tipo = determinarTipo();
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
        // Verificar lado izquierdo
        if (!izq.match(/^[A-Z]$/)) {
            alert("La gramática no cumple con las reglas de tipo 2 o tipo 3.");
            return "No válida";
        }

        gramatica[izq].forEach(der => {
            // Si es cadena vacía (λ), continuar
            if (der === '') return;

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
    } else if (esRegularIzquierda) {
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
    const resultado = document.getElementById("resultadoValidacion");

    // Mostrar mensaje de búsqueda
    resultado.innerHTML = `<div class="buscando">Verificando si la cadena pertenece al lenguaje...</div>`;

    // Caso especial: cadena vacía (epsilon)
    if (cadena.trim() === "") {
        // Verificar derivación directa a epsilon
        if (gramatica[simboloInicial] && gramatica[simboloInicial].includes("λ")) {
            resultado.innerHTML = `<div class="arbol-derivacion">${simboloInicial} → λ</div>`;
            return;
        }

        // Si no hay derivación directa, tratar como cadena vacía para la derivación normal
        cadena = "";
    }

    // Usar un enfoque de búsqueda en anchura (BFS) con límite de iteraciones
    const MAX_ITERACIONES = 100000;
    let iteraciones = 0;

    // Cola para BFS con objetos que contienen la cadena actual y el camino de derivación
    let cola = [{ cadena: simboloInicial, derivacion: [`${simboloInicial}`] }];
    let visitadas = new Set([simboloInicial]);

    // Función para procesar la búsqueda en lotes
    const procesarLote = () => {
        const ITERACIONES_POR_LOTE = 500;
        let i = 0;

        while (i < ITERACIONES_POR_LOTE && cola.length > 0 && iteraciones < MAX_ITERACIONES) {
            const actual = cola.shift();
            iteraciones++;

            // Si la cadena actual coincide con la cadena buscada, hemos encontrado una derivación
            if (actual.cadena === cadena) {
                mostrarResultado(actual.derivacion);
                return;
            }

            // Si la cadena ya es más larga que la buscada y no contiene no terminales, no seguir
            if (actual.cadena.length > cadena.length * 2 && !actual.cadena.match(/[A-Z]/)) {
                continue;
            }

            // Intentar aplicar todas las producciones posibles a cada no terminal
            for (const [izq, producciones] of Object.entries(gramatica)) {
                // Encontrar todas las ocurrencias del lado izquierdo
                let pos = -1;
                while ((pos = actual.cadena.indexOf(izq, pos + 1)) !== -1) {
                    // Aplicar cada producción posible a esta ocurrencia
                    for (let produccion of producciones) {
                        // Si la producción es lambda, reemplazar por cadena vacía
                        if (produccion === "λ") produccion = "";

                        const nuevaCadena =
                            actual.cadena.substring(0, pos) +
                            produccion +
                            actual.cadena.substring(pos + izq.length);

                        // Solo añadir a la cola si no hemos visitado esta cadena antes
                        if (!visitadas.has(nuevaCadena)) {
                            // Crear nueva derivación añadiendo este paso
                            const nuevaDerivacion = [...actual.derivacion, `${actual.cadena} → ${nuevaCadena}`];
                            cola.push({ cadena: nuevaCadena, derivacion: nuevaDerivacion });
                            visitadas.add(nuevaCadena);
                        }
                    }
                }
            }

            i++;
        }

        // Si aún quedan elementos en la cola y no hemos superado el límite, continuar procesando
        if (cola.length > 0 && iteraciones < MAX_ITERACIONES) {
            // Actualizar mensaje de búsqueda con progreso
            resultado.innerHTML = `<div class="buscando">Verificando... (${iteraciones} derivaciones probadas)</div>`;
            setTimeout(procesarLote, 0);
        } else {
            // Si no encontramos una derivación, mostrar mensaje de error
            if (iteraciones >= MAX_ITERACIONES) {
                resultado.innerHTML = `No se pudo determinar si la cadena pertenece al lenguaje después de ${MAX_ITERACIONES} derivaciones.`;
            } else {
                resultado.innerHTML = "La cadena no pertenece al lenguaje.";
            }
        }
    };

    // Función para mostrar el resultado de la derivación
    const mostrarResultado = (derivacion) => {
        const arbol = derivacion.map((paso, i) => {
            return ' '.repeat(i * 2) + paso;
        }).join('\n');
        resultado.innerHTML = `<div class="arbol-derivacion">${arbol}</div>`;
    };

    // Iniciar el procesamiento
    setTimeout(procesarLote, 0);
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
    const LIMITE_CADENAS = 5; // Límite de cadenas a generar

    // Mostrar mensaje de búsqueda
    const resultado = document.getElementById("resultadoGeneracion");
    resultado.innerHTML = `<div class="buscando">Buscando cadenas de longitud ${longitud}...</div>`;

    // Crear un contador para mostrar el progreso
    let ultimaActualizacion = Date.now();

    // Aumentar el límite de iteraciones para longitudes mayores
    const MAX_ITERACIONES = 50000;
    let iteraciones = 0;

    // Usar un enfoque iterativo con una cola priorizada
    // Para longitudes grandes, priorizar cadenas con más terminales
    let cola = [{ cadena: simboloInicial, profundidad: 0 }];
    let cadenasProcesadas = new Set([simboloInicial]);

    // Función para actualizar el mensaje de búsqueda (ejecutada por setTimeout)
    const actualizarProgreso = () => {
        if (generadas.size < LIMITE_CADENAS && iteraciones < MAX_ITERACIONES && cola.length > 0) {
            resultado.innerHTML = `<div class="buscando">Buscando cadenas de longitud ${longitud}... (${iteraciones} iteraciones, ${generadas.size}/${LIMITE_CADENAS} encontradas)</div>`;
            setTimeout(continuarBusqueda, 0);
        } else {
            finalizarBusqueda();
        }
    };

    // Función principal de búsqueda que ejecuta un lote de iteraciones
    const continuarBusqueda = () => {
        const ITERACIONES_POR_LOTE = 1000;
        let i = 0;

        while (i < ITERACIONES_POR_LOTE && cola.length > 0 && generadas.size < LIMITE_CADENAS && iteraciones < MAX_ITERACIONES) {
            // Ordenar la cola para priorizar cadenas prometedoras
            if (longitud > 5 && iteraciones % 100 === 0) {
                cola.sort((a, b) => {
                    const terminalesA = [...a.cadena].filter(c => !/[A-Z]/.test(c)).length;
                    const terminalesB = [...b.cadena].filter(c => !/[A-Z]/.test(c)).length;
                    return terminalesB - terminalesA; // Priorizar cadenas con más terminales
                });
            }

            // ...existing code...
            const { cadena: cadenaActual, profundidad } = cola.shift();
            iteraciones++;

            // Calculamos la longitud efectiva (sin contar símbolos no terminales)
            const longitudEfectiva = [...cadenaActual].filter(c => !/[A-Z]/.test(c)).length;

            // Resto del código de procesamiento...
            // Si la cadena no tiene no terminales y tiene la longitud buscada
            if (!cadenaActual.match(/[A-Z]/) && longitudEfectiva === longitud) {
                // Si es cadena vacía y buscamos longitud 0, mostrar λ
                if (cadenaActual === "" && longitud === 0) {
                    generadas.add("λ");
                } else if (cadenaActual !== "") {
                    generadas.add(cadenaActual);
                }
                continue;
            }

            // Si la parte de terminales ya es más larga que la longitud buscada, no seguimos
            if (longitudEfectiva > longitud) {
                continue;
            }

            // Si la cadena tiene demasiados no terminales, no es prometedora para cadenas largas
            const noTerminales = [...cadenaActual].filter(c => /[A-Z]/.test(c)).length;
            if (longitud > 5 && noTerminales > longitud * 2) {
                continue;
            }

            // Buscamos todas las posibles sustituciones
            for (const [izq, producciones] of Object.entries(gramatica)) {
                if (generadas.size >= LIMITE_CADENAS) break;

                // Encontrar todas las ocurrencias del lado izquierdo
                let pos = -1;
                while ((pos = cadenaActual.indexOf(izq, pos + 1)) !== -1) {
                    // Aplicar cada producción posible
                    for (let produccion of producciones) {
                        if (generadas.size >= LIMITE_CADENAS) break;

                        // Si la producción es lambda, reemplazar por cadena vacía
                        let produccionEfectiva = produccion;
                        if (produccion === "λ") {
                            produccionEfectiva = "";
                        }

                        const nuevaCadena =
                            cadenaActual.substring(0, pos) +
                            produccionEfectiva +
                            cadenaActual.substring(pos + izq.length);

                        // Solo agregamos a la cola si no hemos procesado esta cadena antes
                        if (!cadenasProcesadas.has(nuevaCadena)) {
                            cola.push({ cadena: nuevaCadena, profundidad: profundidad + 1 });
                            cadenasProcesadas.add(nuevaCadena);
                        }
                    }
                }
            }

            i++;
        }

        // Actualizar la interfaz cada cierto tiempo para mostrar el progreso
        actualizarProgreso();
    };

    // Función para mostrar los resultados finales
    const finalizarBusqueda = () => {
        if (generadas.size > 0) {
            const cadenasOrdenadas = [...generadas].sort();
            resultado.innerHTML = cadenasOrdenadas
                .map(cadena => `<div class="cadena-generada">${cadena}</div>`)
                .join('');

            resultado.innerHTML += `<div class="total-cadenas">Mostrando: ${generadas.size} ${generadas.size === LIMITE_CADENAS ? '(limitado a 5)' : ''} cadenas</div>`;
        } else {
            // Proporcionar más información cuando no se encuentran cadenas
            if (iteraciones >= MAX_ITERACIONES) {
                resultado.innerHTML = `No se encontraron cadenas de longitud ${longitud} después de ${MAX_ITERACIONES} iteraciones. Prueba con una longitud menor o una gramática diferente.`;
            } else {
                resultado.innerHTML = `No es posible generar cadenas de longitud ${longitud} con esta gramática.`;
            }
        }
    };

    // Iniciar la búsqueda
    setTimeout(continuarBusqueda, 0);
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
                        <button class="btn-lambda" type="button" onclick="this.previousElementSibling.value += 'λ';">λ</button>
                    </div>
                `;
                reglasContainer.innerHTML += reglaHTML;
            });
        }

        procesarGramatica(); // Procesar la gramática cargada
        agregarNuevaRegla(); // Agregar una nueva regla vacía al final
        alert("Gramática cargada correctamente.");
    };

    lector.onerror = function () {
        alert("Hubo un error al leer el archivo.");
    };

    lector.readAsText(archivo);
}