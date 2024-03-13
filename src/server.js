/**
 * @author: Max Souza
 * @github: https://github.com/Maaacs
 * @repo: https://github.com/Maaacs/Android-Monitors
 * 
 * Descrição:
 * Este código é parte do projeto Android Monitors, que
 * fornece uma interface gráfica para monitoramento de dispositivos Android em tempo rea.
 * Ele permite iniciar/parar a coleta de dados de temperatura e clock do dispositivo,
 * assim como a exportação dos logs coletados para análise posterior.
 *
 * Contribuições são bem-vindas. Para contribuir, por favor visite o repositório do projeto no GitHub.
 *
 * Licença:
 * Este código é distribuído sob a licença MIT, o que significa que pode ser utilizado,
 * copiado, modificado e distribuído livremente, desde que seja mantido o mesmo cabeçalho de autoria.
 *
 * Copyright (c) 2024 Max Souza
 */


const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec, spawn } = require('child_process'); 
const fs = require('fs');
const archiver = require('archiver'); 
const app = express();
// const port = 3000;
const morgan = require("morgan")
require('dotenv').config()
const PORT = process.env.PORT ?? 3000
app.use(morgan("combined"))
app.use(cors());
app.use(express.static('public'));

// Variáveis globais para armazenar o logcat e versão da build
let logcat = '';
let buildVersion = '';


// Funções para coleta do lado do cliente 
function writeLogcat() {
    const logcatProcess = spawn('adb', ['logcat', '-v', 'time']);
    logcatProcess.stdout.on('data', (data) => {
        // Concatena os dados recebidos ao logcat
        logcat += data.toString();
    });
    logcatProcess.on('error', (error) => {
        console.error(`Erro ao escrever o logcat: ${error}`);
    });
}


function clearLogcat() {
    exec('adb logcat -c', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao limpar o buffer do logcat: ${error}`);
        } else {
            // Limpa o logcat
            logcat = '';
        }
    });
}

// Rota logcat que chama as funções de escrever ou limpar 
app.get('/logcat', (req, res) => {
    // Obtêm o parâmetro action da requisição
    const action = req.query.action;
    if (action === 'clear' || action === 'write') {
        if (action === 'clear') {
            clearLogcat();
        } else { 
            writeLogcat();
        }
        res.send('OK');
    } else {
        res.status(400).send('Ação inválida');
    }
});



// Rota temperatura
app.get('/temperatura', (req, res) => {
    exec("adb shell cat /sys/class/thermal/thermal_zone0/temp", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Erro ao obter a temperatura');
        }
        const temperatura = parseInt(stdout) / 1000.0;
        res.json({ temperatura });
    });
});


// Rota clock
app.get('/clock', (req, res) => {
    exec("adb shell cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Erro ao obter o clock do processador');
        }
        const clock = parseInt(stdout) / 1e6;
        res.json({ clock });
    });
});

app.get('/processos', (req, res) => {
    exec("adb shell top -n 1 -b", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Erro ao obter os processos');
        }
        res.send(stdout);
    });
});

// Rota nome device
app.get('/nomeDispositivo', (req, res) => {
    exec("adb shell getprop ro.product.model", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Erro ao obter o nome do dispositivo');
        }
        const nomeDispositivo = stdout.trim();
        res.json({ nomeDispositivo });
    });
});


// Rota build
app.get('/build-version', (req, res) => {
    exec("adb shell getprop ro.build.display.id", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Erro ao obter o nome da versão da build');
        }
        buildVersion = stdout.trim();
        res.json({ buildVersion });
    });
});


// rota para salva as imagens no servidor
app.use(express.json({ limit: '50mb' })); // Aumenta tamanho máximo permitido para o corpo da requisição
app.post('/save-canvas-image', (req, res) => {
    const { imageName, imageData } = req.body; // Extrai tanto o imageName quanto imageData do corpo da requisição
    const imageBuffer = Buffer.from(imageData.replace(/^data:image\/png;base64,/, ""), 'base64'); // Converte os dados de base64 para um buffer
    const filePath = path.join(__dirname, 'outputs', imageName); // Usa o imageName para criar o caminho do arquivo
    const outputDirectory = path.dirname(filePath); // Determina o diretório baseado no filePath

    // Tenta criar o diretório se não existir
    console.log(`Creating directory: ${outputDirectory}`);
    fs.mkdirSync(outputDirectory, { recursive: true });
    console.log(`Directory created or already exists: ${outputDirectory}`);

    // Tenta salvar o arquivo no diretório
    fs.writeFile(filePath, imageBuffer, (err) => {
        if (err) {
            console.error(`Error saving the image: ${err}`);
            return res.status(500).send({ message: 'Error saving the image' });
        }
        console.log(`Image ${imageName} saved successfully at ${filePath}`);
        res.send({ message: `${imageName} saved successfully` });
    });
});




// Rota exportar que zipa os artefatos e os exporta
app.get('/export-logs', async (req, res) => {
    // Data e hora atual no horário local
    const currentDate = new Date();
    const localDateString = currentDate.toLocaleDateString('pt-BR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\//g, '');
    const localTimeString = currentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).replace(/:/g, '-');

 
    const buildName = buildVersion || "build_desconhecida"; 

    // Gera o zip
    const filename = `${localDateString}_${localTimeString}_${buildName}.zip`;
    const outputFilePath = path.join(__dirname, 'outputs', filename);
    const output = fs.createWriteStream(outputFilePath);

    const archive = archiver('zip', {
        zlib: { level: 9 } // Nível de compressão
    });

    archive.on('error', (err) => {
        console.error(`Erro ao criar o arquivo zip: ${err}`);
        res.status(500).send('Erro ao exportar os logs');
    });

    archive.on('end', () => {
        console.log(`Arquivo zip ${filename} criado com sucesso`);
        res.send(`Arquivo ZIP ${filename} salvo em src/outputs/`);
        
        // Após a criação do ZIP, remove os arquivos de imagem
        const temperatureChartPath = path.join(__dirname, 'outputs', 'temperatureChart.png');
        const clockChartPath = path.join(__dirname, 'outputs', 'clockChart.png');
        fs.existsSync(temperatureChartPath) && fs.unlinkSync(temperatureChartPath);
        fs.existsSync(clockChartPath) && fs.unlinkSync(clockChartPath);
    });

    archive.pipe(output);

    // Adiciona o conteúdo do logcat ao ZIP
    archive.append(logcat, { name: 'logcat.txt' });

    // Adiciona as imagens dos gráficos ao ZIP
    const temperatureChartPath = path.join(__dirname, 'outputs', 'temperatureChart.png');
    const clockChartPath = path.join(__dirname, 'outputs', 'clockChart.png');
    if (fs.existsSync(temperatureChartPath)) {
        archive.file(temperatureChartPath, { name: 'temperatureChart.png' });
    }
    if (fs.existsSync(clockChartPath)) {
        archive.file(clockChartPath, { name: 'clockChart.png' });
    }

    archive.finalize();
});




// app.listen(port, () => {
//     console.log(`Servidor rodando em http://localhost:${port}`);
// });
app.listen(PORT)
