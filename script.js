const imagemInput = document.getElementById("imagemInput");
const segundaImagemInput = document.getElementById("segundaImagemInput");

const canvasOriginal = document.getElementById("canvasOriginal");
const canvasResultado = document.getElementById("canvasResultado");
const canvasHistograma = document.getElementById("canvasHistograma");

const contextoOriginal = canvasOriginal.getContext("2d");
const contextoResultado = canvasResultado.getContext("2d");
const contextoHistograma = canvasHistograma.getContext("2d");

let imagemOriginal = null;
let segundaImagem = null;

/* Limita um valor ao intervalo de 0 a 255. */
function limitar(valor) {

    if (valor < 0) {
        return 0;
    }
    if (valor > 255) {
        return 255;
    }

    return Math.round(valor); /* Valores entre 0 e 255 são arredondados */  
}

/* Converte a imagem original para tons de cinza. Fórmula utilizada: NC = 0.299R + 0.587G + 0.114B */
function converterParaCinza(data) {

    const resultado = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const cinza = 0.299 * r + 0.587 * g + 0.114 * b;

        resultado[i] = cinza;
        resultado[i + 1] = cinza;
        resultado[i + 2] = cinza;
        resultado[i + 3] = data[i + 3];
    }

    return resultado;
}

/* Cria um objeto ImageData.*/
function criarImageData(data, largura, altura) {

    const novaImagem = new ImageData(largura, altura);

    for (let i = 0; i < data.length; i++) {
        novaImagem.data[i] = data[i];
    }

    return novaImagem;
}

/* Obtém a imagem atualmente exibida no resultado.*/
function obterImagemResultado() {

    return contextoResultado.getImageData(0, 0, canvasResultado.width, canvasResultado.height);
}

/* Mostra uma imagem no Canvas de resultado. */
function mostrarResultado(data, largura, altura) {

    canvasResultado.width = largura;
    canvasResultado.height = altura;

    const novaImagem = criarImageData(data, largura, altura);

    contextoResultado.putImageData(novaImagem, 0, 0);
}

function baixarImagemResultado() {

    if (!imagemOriginal) {
        alert("Selecione uma imagem primeiro.");
        return;
    }

    const link = document.createElement("a");
    link.download = "imagem-resultante.png";
    link.href = canvasResultado.toDataURL("image/png");
    link.click();
}

/* Função para restaurar a imagem original. */
function restaurarOriginal() {

    if (!imagemOriginal) {
        alert("Selecione uma imagem primeiro.");
        return;
    }

    canvasResultado.width = canvasOriginal.width;
    canvasResultado.height = canvasOriginal.height;

    contextoResultado.drawImage(canvasOriginal, 0, 0);

    limparHistograma();
}

function verificarImagem() {

    if (!imagemOriginal) {
        alert("Selecione uma imagem primeiro.");
        return false;
    }

    return true;
}

/* Obtém o nível de cinza de um pixel. */
function obterPixel(data, largura, x, y) {

    const indice = (y * largura + x) * 4;

    return data[indice];
}

/* Define o valor de um pixel. */
function definirPixel(data, largura, x, y, valor) {

    const indice = (y * largura + x) * 4;

    valor = limitar(valor);

    data[indice] = valor;
    data[indice + 1] = valor;
    data[indice + 2] = valor;
    data[indice + 3] = 255;
}

/* Função para transformar a imagem em tons de cinza: usada em negativo, logaritmo, logaritmo inverso, potência, raiz, expansçao e compressão*/
function transformarTonsCinza(data, calcularValor) {
    const resultado = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        const valor = limitar(calcularValor(data[i]));
        resultado[i] = valor;
        resultado[i + 1] = valor;
        resultado[i + 2] = valor;
        resultado[i + 3] = 255;
    }

    return resultado;
}

function limitarCoordenada(valor, tamanho) {
    return Math.max(0, Math.min(valor, tamanho - 1));
}

/* Obtém uma máscara de vizinhança. */
function obterVizinhos(data, largura, altura, x, y, tamanho) {
    const valores = [];

    const raio = Math.floor(tamanho / 2);

    for (let j = -raio; j <= raio; j++) {

        for (let i = -raio; i <= raio; i++) {

            const novoX = limitarCoordenada(x + i, largura);
            const novoY = limitarCoordenada(y + j, altura);
            /* Para as bordas, utilizamos o próprio pixel mais próximo. */
            valores.push(obterPixel(data, largura, novoX, novoY));
        }
    }

    return valores;
}

/* Obtém o tamanho da máscara que o usuário escolheu. */
function obterTamanhoMascara() {
    return Number(document.getElementById("tamanhoMascara").value);
}

/* Função para carregar a imagem principal. */

imagemInput.addEventListener("change", function() {
    const arquivo = imagemInput.files[0];

    if (!arquivo) {
        return;
    }

    const imagem = new Image();

    imagem.onload = function() {

        canvasOriginal.width = imagem.width;
        canvasOriginal.height = imagem.height;

        canvasResultado.width = imagem.width;
        canvasResultado.height = imagem.height;

        contextoOriginal.drawImage(imagem, 0, 0);
        const imagemColorida = contextoOriginal.getImageData(0, 0, imagem.width, imagem.height);
        imagemOriginal = criarImageData(converterParaCinza(imagemColorida.data), imagem.width, imagem.height);
        contextoOriginal.putImageData(imagemOriginal, 0, 0);
        contextoResultado.putImageData(imagemOriginal, 0, 0);

        document.getElementById("informacaoImagem").textContent = "Imagem: " + imagem.width + " × " + imagem.height;

        limparHistograma();
    };

    imagem.src = URL.createObjectURL(arquivo);
});

/* Função para carregar a segunda imagem. */
segundaImagemInput.addEventListener("change", function() {
    const arquivo = segundaImagemInput.files[0];

    if (!arquivo) {
        segundaImagem = null;
        return;
    }

    const imagem = new Image();

    imagem.onload = function() {
        const canvasTemporario = document.createElement("canvas");

        canvasTemporario.width = imagem.width;
        canvasTemporario.height = imagem.height;

        const contextoTemporario = canvasTemporario.getContext("2d");

        contextoTemporario.drawImage(imagem, 0, 0);

        const imagemColorida = contextoTemporario.getImageData(0, 0, imagem.width, imagem.height);
        segundaImagem = criarImageData(converterParaCinza(imagemColorida.data), imagem.width, imagem.height);
    };

    imagem.src = URL.createObjectURL(arquivo);
});

/* Ponta de prova */

function atualizarPontaDeProva(canvas, contexto) {
    canvas.addEventListener("mousemove", function(event) {

        if (!imagemOriginal) {
            return;
        }

        const retangulo = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - retangulo.left) * canvas.width / retangulo.width);
        const y = Math.floor((event.clientY - retangulo.top) * canvas.height / retangulo.height);

        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
            return;
        }

        const nc = contexto.getImageData(x, y, 1, 1).data[0];
        document.getElementById("coordenadaX").textContent = x;
        document.getElementById("coordenadaY").textContent = y;
        document.getElementById("nivelCinza").textContent = nc;
    });

    canvas.addEventListener("mouseleave", function() {
        document.getElementById("coordenadaX").textContent = "-";
        document.getElementById("coordenadaY").textContent = "-";
        document.getElementById("nivelCinza").textContent = "-";
    });
}

atualizarPontaDeProva(canvasOriginal, contextoOriginal);
atualizarPontaDeProva(canvasResultado, contextoResultado);

/* Negativo: g = 255 - r */

function negativo(data) {
    return transformarTonsCinza(data, valor => 255 - valor);
}

function aplicarNegativo() {
    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = negativo(imagem.data);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Logaritmo: s = c * log(1 + r) */

function logaritmo(data) {
    const c = 255 / Math.log(256); /* Limitar os valores no intervalo 0-255 */
    return transformarTonsCinza(data, r => c * Math.log(1 + r));
}

function aplicarLogaritmo() {
    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = logaritmo(imagem.data);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Logaritmo Inverso: s = e^(r / c) - 1 */

function logaritmoInverso(data) {
    const c = 255 / Math.log(256); /* Limitar os valores no intervalo 0-255 */
    return transformarTonsCinza(data, r => Math.exp(r / c) - 1);
}
function aplicarLogaritmoInverso() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = logaritmoInverso(imagem.data);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Potência: s = 255 * (r / 255)^gamma */

function potencia(data, gamma) {
    return transformarTonsCinza(data, r => 255 * Math.pow(r / 255, gamma));
}
function aplicarPotencia() {

    if (!verificarImagem()) {
        return;
    }

    const gamma = Number(document.getElementById("gamma").value);

    if (gamma <= 0) {
        alert("O gamma deve ser maior que zero.");
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = potencia(imagem.data, gamma);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Raiz:  s = 255 * (r / 255)^(1 / gamma) */

function raiz(data, gamma) {
    return transformarTonsCinza(data, r => 255 * Math.pow(r / 255, 1 / gamma));
}

function aplicarRaiz() {

    if (!verificarImagem()) {
        return;
    }

    const gamma = Number(document.getElementById("gamma").value);

    if (gamma <= 0) {
        alert("O gamma deve ser maior que zero.");
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = raiz(imagem.data, gamma);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Expansão: g = a * r + b */

function expansao(data, a, b) {
    return transformarTonsCinza(data, r => a * r + b);
}

function aplicarExpansao() {

    if (!verificarImagem()) {
        return;
    }

    const a = Number(document.getElementById("valorA").value);

    const b = Number(document.getElementById("valorB").value);

    const imagem = obterImagemResultado();

    const resultado = expansao(imagem.data, a, b);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Compressão: g = r / a - b */

function compressao(data, a, b) {
    if (a === 0) {
        return null;
    }

    return transformarTonsCinza(data, r => r / a - b);
}

function aplicarCompressao() {

    if (!verificarImagem()) {
        return;
    }

    const a = Number(document.getElementById("valorA").value);

    const b = Number(document.getElementById("valorB").value);

    if (a === 0) {
        alert("O valor de A não pode ser zero.");
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = compressao(imagem.data, a, b);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Nearest Neighbor: Ampliação por replicação de pixels mais próximos*/

/*
    Ampliação utilizando replicação de pixels.

    Para cada pixel da imagem nova:

    x_original = floor(x_novo / fator)
    y_original = floor(y_novo / fator)
*/
function nearestNeighbor(data, largura, altura, fator) {

    const novaLargura = largura * fator;

    const novaAltura = altura * fator;

    const resultado = new Uint8ClampedArray(novaLargura * novaAltura * 4);

    for (let y = 0; y < novaAltura; y++) {

        for (let x = 0; x < novaLargura; x++) {

            const xOriginal = Math.floor(x / fator);

            const yOriginal = Math.floor(y / fator);

            const valor = obterPixel(data, largura, xOriginal, yOriginal);
            definirPixel(resultado, novaLargura, x, y, valor);
        }
    }

    return {
        data: resultado,
        largura: novaLargura,
        altura: novaAltura
    };
}

function aplicarNearestNeighbor(fator) {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = nearestNeighbor(imagem.data, imagem.width, imagem.height, fator);

    mostrarResultado(resultado.data, resultado.largura, resultado.altura);
}

/* Bilinear: Ampliação por interpolação dos 4 pixels vizinhos */

function bilinear(data, largura, altura, fator) {

    const novaLargura = largura * fator;

    const novaAltura = altura * fator;

    const resultado = new Uint8ClampedArray(novaLargura * novaAltura * 4);

    for (let y = 0; y < novaAltura; y++) {

        for (let x = 0; x < novaLargura; x++) {

            const origemX = x / fator;

            const origemY = y / fator;

            const x1 = Math.floor(origemX);

            const y1 = Math.floor(origemY);

            const x2 = Math.min(x1 + 1, largura - 1);

            const y2 = Math.min(y1 + 1, altura - 1);

            const dx = origemX - x1;

            const dy = origemY - y1;

            const q11 = obterPixel(data, largura, x1, y1);

            const q21 = obterPixel(data, largura, x2, y1);

            const q12 = obterPixel(data, largura, x1, y2);

            const q22 = obterPixel(data, largura, x2, y2);

            const valor = q11 * (1 - dx) * (1 - dy) + q21 * dx * (1 - dy) + q12 * (1 - dx) * dy + q22 * dx * dy;

            definirPixel(resultado, novaLargura, x, y, valor);
        }
    }

    return {
        data: resultado,
        largura: novaLargura,
        altura: novaAltura
    };
}

function aplicarBilinear(fator) {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = bilinear(imagem.data, imagem.width, imagem.height, fator);

    mostrarResultado(resultado.data, resultado.largura, resultado.altura);
}

/* Histograma */

let graficoHistograma = null;

/* Calcula o histograma da imagem, cada posição do vetor (de 256 posições) representa um nível de cinza de 0 até 255. */
function calcularHistograma(data) {

    const histograma = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {

        const valor = data[i];

        histograma[valor]++;
    }

    return histograma;
}

/* Exibe o histograma da imagem utilizando a biblioteca Chart.js. */
function desenharHistograma(histograma) {

    if (graficoHistograma !== null) {

        graficoHistograma.destroy();
    }

    const labels = [];

    for (let i = 0; i < 256; i++) {

        labels.push(i);
    }

    graficoHistograma = new Chart(canvasHistograma, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Quantidade de pixels",
                    data: histograma
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Nível de cinza"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Quantidade de pixels"
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function mostrarHistogramaOriginal() {

    if (!imagemOriginal) {

        alert("Selecione uma imagem primeiro.");

        return;
    }

    const histograma = calcularHistograma(imagemOriginal.data);

    desenharHistograma(histograma);
}

function mostrarHistogramaResultado() {

    if (!verificarImagem()) {

        return;
    }

    const imagem = obterImagemResultado();

    const histograma = calcularHistograma(imagem.data);

    desenharHistograma(histograma);
}

function limparHistograma() {

    if (graficoHistograma !== null) {

        graficoHistograma.destroy();

        graficoHistograma = null;
    }
}

/* Equalização: Utiliza o histograma acumulado para aplicar CDF */

function equalizacao(data, largura, altura) {

    const histograma = calcularHistograma(data);

    const cdf = new Array(256).fill(0);

    cdf[0] = histograma[0];

    for (let i = 1; i < 256; i++) {

        cdf[i] = cdf[i - 1] + histograma[i];
    }

    let cdfMin = 0;

    for (let i = 0; i < 256; i++) {

        if (cdf[i] > 0) {

            cdfMin = cdf[i];

            break;
        }
    }

    const totalPixels = largura * altura;
    const mapa = new Uint8ClampedArray(256);

    for (let i = 0; i < 256; i++) {
        mapa[i] = totalPixels === cdfMin
            ? i
            : limitar(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
    }

    return transformarTonsCinza(data, valor => mapa[valor]);
}

function aplicarEqualizacao() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = equalizacao(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);

    const histograma = calcularHistograma(resultado);

    desenharHistograma(histograma);
}

/* Espelhamento horizonatal */

function espelhamentoHorizontal(data, largura, altura) {

    const resultado = new Uint8ClampedArray(data.length);

    for (let y = 0; y < altura; y++) {

        for (let x = 0; x < largura; x++) {

            const origemX = largura - 1 - x;

            const origemIndice = (y * largura + origemX) * 4;

            const novoIndice = (y * largura + x) * 4;

            resultado[novoIndice] = data[origemIndice];

            resultado[novoIndice + 1] = data[origemIndice + 1];

            resultado[novoIndice + 2] = data[origemIndice + 2];

            resultado[novoIndice + 3] = 255;
        }
    }

    return resultado;
}

function aplicarEspelhamentoHorizontal() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = espelhamentoHorizontal(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Espelhamento vertical */

function espelhamentoVertical(data, largura, altura) {

    const resultado = new Uint8ClampedArray(data.length);

    for (let y = 0; y < altura; y++) {

        for (let x = 0; x < largura; x++) {

            const origemY = altura - 1 - y;

            const origemIndice = (origemY * largura + x) * 4;

            const novoIndice = (y * largura + x) * 4;

            resultado[novoIndice] = data[origemIndice];

            resultado[novoIndice + 1] = data[origemIndice + 1];

            resultado[novoIndice + 2] = data[origemIndice + 2];

            resultado[novoIndice + 3] = 255;
        }
    }

    return resultado;
}

function aplicarEspelhamentoVertical() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = espelhamentoVertical(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Rotação 90° Horário */

function rotacao90Horario(data, largura, altura) {

    const novaLargura = altura;
    const novaAltura = largura;

    const resultado = new Uint8ClampedArray(novaLargura * novaAltura * 4);

    for (let y = 0; y < altura; y++) {

        for (let x = 0; x < largura; x++) {

            const novoX = altura - 1 - y;

            const novoY = x;

            const origemIndice = (y * largura + x) * 4;

            const novoIndice = (novoY * novaLargura + novoX) * 4;

            resultado[novoIndice] = data[origemIndice];

            resultado[novoIndice + 1] = data[origemIndice + 1];

            resultado[novoIndice + 2] = data[origemIndice + 2];

            resultado[novoIndice + 3] = 255;
        }
    }

    return {
        data: resultado,
        largura: novaLargura,
        altura: novaAltura
    };
}

function aplicarRotacao90Horario() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = rotacao90Horario(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado.data, resultado.largura, resultado.altura);
}

/* Rotação 90° Anti-Horário */

function rotacao90AntiHorario(data, largura, altura) {

    const novaLargura = altura;
    const novaAltura = largura;

    const resultado = new Uint8ClampedArray(novaLargura * novaAltura * 4);

    for (let y = 0; y < altura; y++) {

        for (let x = 0; x < largura; x++) {

            const novoX = y;

            const novoY = largura - 1 - x;

            const origemIndice = (y * largura + x) * 4;

            const novoIndice = (novoY * novaLargura + novoX) * 4;

            resultado[novoIndice] = data[origemIndice];

            resultado[novoIndice + 1] = data[origemIndice + 1];

            resultado[novoIndice + 2] = data[origemIndice + 2];

            resultado[novoIndice + 3] = 255;
        }
    }

    return {
        data: resultado,
        largura: novaLargura,
        altura: novaAltura
    };
}

function aplicarRotacao90AntiHorario() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = rotacao90AntiHorario(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado.data, resultado.largura, resultado.altura);
}

/* Rotação 180° */

function rotacao180(data, largura, altura) {

    const resultado = new Uint8ClampedArray(data.length);

    for (let y = 0; y < altura; y++) {

        for (let x = 0; x < largura; x++) {

            const origemX = largura - 1 - x;

            const origemY = altura - 1 - y;

            const origemIndice = (origemY * largura + origemX) * 4;

            const novoIndice = (y * largura + x) * 4;

            resultado[novoIndice] = data[origemIndice];

            resultado[novoIndice + 1] = data[origemIndice + 1];

            resultado[novoIndice + 2] = data[origemIndice + 2];

            resultado[novoIndice + 3] = 255;
        }
    }

    return resultado;
}

function aplicarRotacao180() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = rotacao180(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Soma das duas imagens */

/*(imagem1 * porcentagem1) + (imagem2 * porcentagem2)*/
function somarImagens(data1, data2, porcentagem1, porcentagem2) {

    const resultado = new Uint8ClampedArray(data1.length);

    for (let i = 0; i < data1.length; i += 4) {

        const valor1 = data1[i];

        const valor2 = data2[i];

        const novoValor = (valor1 * porcentagem1 + valor2 * porcentagem2) / 100;

        const valor = limitar(novoValor);

        resultado[i] = valor;
        resultado[i + 1] = valor;
        resultado[i + 2] = valor;
        resultado[i + 3] = 255;
    }

    return resultado;
}

function aplicarSomaImagens() {

    if (!verificarImagem()) {
        return;
    }

    if (!segundaImagem) {
        alert("Selecione a segunda imagem.");
        return;
    }

    const porcentagem1 = Number(document.getElementById("porcentagemImagem1").value);

    const porcentagem2 = Number(document.getElementById("porcentagemImagem2").value);

    if (porcentagem1 < 0 || porcentagem2 < 0) {
        alert("As porcentagens não podem ser negativas.");
        return;
    }

    if (porcentagem1 + porcentagem2 !== 100) {
        alert("A soma das porcentagens deve ser 100%.");
        return;
    }

    const imagem1 = obterImagemResultado();

    const canvas2 = document.createElement("canvas");

    canvas2.width = imagem1.width;

    canvas2.height = imagem1.height;

    const contexto2 = canvas2.getContext("2d");

    contexto2.drawImage(criarCanvasComImageData(segundaImagem), 0, 0, imagem1.width, imagem1.height);

    const imagem2 = contexto2.getImageData(0, 0, imagem1.width, imagem1.height);

    const resultado = somarImagens(imagem1.data, imagem2.data, porcentagem1, porcentagem2);

    mostrarResultado(resultado, imagem1.width, imagem1.height);
}

function criarCanvasComImageData(imageData) {

    const canvas = document.createElement("canvas");

    canvas.width = imageData.width;

    canvas.height = imageData.height;

    const contexto = canvas.getContext("2d");

    contexto.putImageData(imageData, 0, 0);

    return canvas;
}

/* Função para aplicar o filtro nos vizinhos: utilizada na média, mediana e moda */

function aplicarFiltroVizinhos(data, largura, altura, tamanho, calcularValor) {

    const resultado = new Uint8ClampedArray(data.length);

    for (let y = 0; y < altura; y++) {
        for (let x = 0; x < largura; x++) {
            const vizinhos = obterVizinhos(data, largura, altura, x, y, tamanho);
            definirPixel(resultado, largura, x, y, calcularValor(vizinhos));
        }
    }

    return resultado;
}
/* Filtro da média */
function media(data, largura, altura, tamanho) {
    return aplicarFiltroVizinhos(data, largura, altura, tamanho, vizinhos =>
        vizinhos.reduce((soma, valor) => soma + valor, 0) / vizinhos.length
    );
}

function aplicarMedia() {

    if (!verificarImagem()) {
        return;
    }

    const tamanho = obterTamanhoMascara();

    const imagem = obterImagemResultado();

    const resultado = media(imagem.data, imagem.width, imagem.height, tamanho);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Filtro da mediana */

function mediana(data, largura, altura, tamanho) {
    return aplicarFiltroVizinhos(data, largura, altura, tamanho, vizinhos => {
        vizinhos.sort((a, b) => a - b);
        return vizinhos[Math.floor(vizinhos.length / 2)];
    });
}

function aplicarMediana() {

    if (!verificarImagem()) {
        return;
    }

    const tamanho = obterTamanhoMascara();

    const imagem = obterImagemResultado();

    const resultado = mediana(imagem.data, imagem.width, imagem.height, tamanho);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Filtro da moda */

function moda(data, largura, altura, tamanho) {
    return aplicarFiltroVizinhos(data, largura, altura, tamanho, vizinhos => {
        vizinhos.sort((a, b) => a - b);

        let valorModa = vizinhos[0];
        let maiorFrequencia = 0;
        let frequencia = 0;

        for (let i = 0; i < vizinhos.length; i++) {
            frequencia = i > 0 && vizinhos[i] === vizinhos[i - 1] ? frequencia + 1 : 1;

            if (frequencia > maiorFrequencia) {
                maiorFrequencia = frequencia;
                valorModa = vizinhos[i];
            }
        }

        return valorModa;
    });
}

function aplicarModa() {

    if (!verificarImagem()) {
        return;
    }

    const tamanho = obterTamanhoMascara();

    const imagem = obterImagemResultado();

    const resultado = moda(imagem.data, imagem.width, imagem.height, tamanho);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Filtro min */

function filtroMin(data, largura, altura, tamanho) {
    return aplicarFiltroVizinhos(data, largura, altura, tamanho, vizinhos => Math.min(...vizinhos));
}

function aplicarMin() {

    if (!verificarImagem()) {
        return;
    }

    const tamanho = obterTamanhoMascara();

    const imagem = obterImagemResultado();

    const resultado = filtroMin(imagem.data, imagem.width, imagem.height, tamanho);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Filtro max */

function filtroMax(data, largura, altura, tamanho) {
    return aplicarFiltroVizinhos(data, largura, altura, tamanho, vizinhos => Math.max(...vizinhos));
}

function aplicarMax() {

    if (!verificarImagem()) {
        return;
    }

    const tamanho = obterTamanhoMascara();

    const imagem = obterImagemResultado();

    const resultado = filtroMax(imagem.data, imagem.width, imagem.height, tamanho);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Convolução (necessário para as operações de Passa-Alta - Laplaciano, Prewitt, Sobel) */

function aplicarMascaraConvolucao(data, largura, altura, mascara) {

    const resultado = new Uint8ClampedArray(data.length);

    const tamanho = mascara.length;

    const raio = Math.floor(tamanho / 2);

    for (let y = 0; y < altura; y++) {

        for (let x = 0; x < largura; x++) {

            let soma = 0;

            for (let j = 0; j < tamanho; j++) {

                for (let i = 0; i < tamanho; i++) {

                    const novoX = limitarCoordenada(x + i - raio, largura);
                    const novoY = limitarCoordenada(y + j - raio, altura);

                    const pixel = obterPixel(data, largura, novoX, novoY);

                    soma += pixel * mascara[j][i];
                }
            }

            definirPixel(resultado, largura, x, y, soma);
        }
    }

    return resultado;
}

/* Laplaciano */

function laplaciano(data, largura, altura) {

    const mascara = [
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0]
    ];

    const resultado = aplicarMascaraConvolucao(data, largura, altura, mascara);

    return resultado;
}

function aplicarLaplaciano() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = laplaciano(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/*
    High Boost: Utilizamos a versão da máscara:

        -1  -1  -1
        -1  A+8 -1
        -1  -1  -1
*/
function highBoost(data, largura, altura, A) {

    const mascara = [
        [-1, -1, -1],
        [-1, A + 8, -1],
        [-1, -1, -1]
    ];

    return aplicarMascaraConvolucao(data, largura, altura, mascara);
}

function aplicarHighBoost() {

    if (!verificarImagem()) {
        return;
    }

    const A = Number(document.getElementById("fatorHighBoost").value);

    const imagem = obterImagemResultado();

    const resultado = highBoost(imagem.data, imagem.width, imagem.height, A);

    mostrarResultado(resultado, imagem.width, imagem.height);
}


/* Função para calcular o gradiente da imagem: utilizada em Prewitt e Sobel */
function calcularGradiente(data, largura, altura, mascaraX, mascaraY) {

    const resultado = new Uint8ClampedArray(data.length);
    const raioX = Math.floor(mascaraX[0].length / 2);
    const raioY = Math.floor(mascaraX.length / 2);

    for (let y = 0; y < altura; y++) {
        for (let x = 0; x < largura; x++) {
            let gx = 0;
            let gy = 0;

            for (let j = 0; j < mascaraX.length; j++) {
                for (let i = 0; i < mascaraX[j].length; i++) {
                    const novoX = limitarCoordenada(x + i - raioX, largura);
                    const novoY = limitarCoordenada(y + j - raioY, altura);
                    const pixel = obterPixel(data, largura, novoX, novoY);

                    gx += pixel * mascaraX[j][i];
                    gy += pixel * mascaraY[j][i];
                }
            }

            definirPixel(resultado, largura, x, y, Math.sqrt(gx * gx + gy * gy));
        }
    }

    return resultado;
}

/* Prewitt */
function prewitt(data, largura, altura) {

    const mascaraX = [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1]
    ];

    const mascaraY = [
        [-1, -1, -1],
        [0, 0, 0],
        [1, 1, 1]
    ];

    return calcularGradiente(data, largura, altura, mascaraX, mascaraY);
}

function aplicarPrewitt() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = prewitt(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);
}

/* Sobel */

function sobel(data, largura, altura) {

    const mascaraX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];

    const mascaraY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ];

    return calcularGradiente(data, largura, altura, mascaraX, mascaraY);
}

function aplicarSobel() {

    if (!verificarImagem()) {
        return;
    }

    const imagem = obterImagemResultado();

    const resultado = sobel(imagem.data, imagem.width, imagem.height);

    mostrarResultado(resultado, imagem.width, imagem.height);
}
