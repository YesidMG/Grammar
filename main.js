import { $ } from './src/utils.js'
import { agregarNuevaRegla } from './src/dom.js';
import { procesarGramatica, validarCadena, generarCadenas } from './src/grammar.js'


// Llama a la función para agregar la primera regla al cargar la página
window.onload = agregarNuevaRegla;

const buttonProcesarGramatica = $("#procesar-gramatica");
const buttonValidarCadena = $("#validar-cadena");
const buttonGenerarCadenas = $("#generar-cadena");

buttonProcesarGramatica.addEventListener("click", procesarGramatica);
buttonValidarCadena.addEventListener("click", validarCadena);
buttonGenerarCadenas.addEventListener("click", generarCadenas);