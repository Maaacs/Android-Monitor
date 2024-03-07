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


document.addEventListener('DOMContentLoaded', function() {
    var tempChartCtx = document.getElementById('temperatureChart').getContext('2d');
    var clockChartCtx = document.getElementById('clockChart').getContext('2d');
    var autoCollectTempIntervalId, autoCollectClockIntervalId;
    let isCollecting = false; 

    // Canvas art
    var temperatureChart = new Chart(tempChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    }
                }
            },
            backgroundColor: '#fff'
        }
    });

    var clockChart = new Chart(clockChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Clock',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Clock (MHz)'
                    }
                }
            }
        }
    });


    // Nome do device
    function fetchDeviceInfo() {
        fetch('http://localhost:3000/nomeDispositivo')
            .then(response => response.json())
            .then(data => {
                const deviceName = data.nomeDispositivo || 'Nome Indisponível';
                // Versão da build
                fetch('http://localhost:3000/build-version')
                    .then(response => response.json())
                    .then(buildData => {
                        const buildVersion = buildData.buildVersion || 'Versão Indisponível';
                        document.getElementById('deviceHeader').textContent = `Dispositivo: ${deviceName} - Build: ${buildVersion}`;
                    })
                    .catch(error => {
                        console.error('Erro ao buscar a versão da build:', error);
                        document.getElementById('deviceHeader').textContent = `Dispositivo: ${deviceName} - Erro ao carregar a versão da build.`;
                    });
            })
            .catch(error => {
                console.error('Erro ao buscar o nome do dispositivo:', error);
                document.getElementById('deviceHeader').textContent = 'Erro ao carregar informações do dispositivo.';
            });
    }
    fetchDeviceInfo(); 
    

    // Atualiza o gráfico
    function fetchDataAndUpdateChart(url, elementId, chart, datasetIndex) {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                document.getElementById(elementId).innerText = `${elementId === 'temperatura' ? 'Temperatura: ' : 'Clock: '}${data[elementId]}${elementId === 'temperatura' ? '°C' : ' MHz'}`;
                var now = new Date().toLocaleTimeString();
                chart.data.labels.push(now);
                chart.data.datasets[datasetIndex].data.push(data[elementId]);
                chart.update();
            })
            .catch(error => console.error(`Erro ao buscar ${elementId}:`, error));
    }

    // Funçao para mudar o status/cor do botão
    function toggleButton(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (isActive) {
            button.classList.remove('btn-success'); // Bootstrap class para green
            button.classList.add('btn-danger'); // Bootstrap class para red
            button.textContent = `Parar`;
        } else {
            button.classList.remove('btn-danger');
            button.classList.add('btn-success');
            button.textContent = `Iniciar`;
        }
    }
    

    // Apresenta o valor do clock e temperatura
    function updateVisibility(elementId) {
        var element = document.getElementById(elementId);
        if (element.textContent.trim() === '') {
            element.style.visibility = 'hidden';
        } else {
            element.style.visibility = 'visible';
        }
    }
    

    // Função para enviar uma requisição ao servidor para limpar ou escrever o logcat
    function toggleLogcat(action) {
        fetch(`http://localhost:3000/logcat?action=${action}`)
            .then(response => {
                if (response.ok) {
                    console.log(`Logcat ${action} com sucesso`);
                } else {
                    console.error(`Erro ao ${action} o logcat: ${response.status} ${response.statusText}`);
                }
            })
            .catch(error => console.error(`Erro ao ${action} o logcat: ${error}`));
    }

    // Função para exportar os logs
    function exportLogs() {
        fetch('http://localhost:3000/export-logs')
            .then(response => {
                if (response.ok) {
                    console.log("Logs exportados com sucesso.");
                } else {
                    throw new Error('Falha ao exportar logs.');
                }
            })
            .catch(error => console.error(`Erro ao exportar os logs: ${error}`));
    }
    
    // Função para salvar a imagem do canvas no servidor
    function saveCanvasImage(chartId, imageName) {
        const canvas = document.getElementById(chartId);
        const imageData = canvas.toDataURL('image/png');

        fetch('/save-canvas-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageName: imageName,
                imageData: imageData
            })
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Erro ao salvar a imagem do gráfico:', error));
    }

    // Função para adicionar um fundo branco aos gráficos do canvas
    function configuraFundoBrancoParaExportacao() {
        // Configura o fundo branco para o gráfico de temperatura
        var canvasTemperatura = document.getElementById('temperatureChart');
        var ctxTemperatura = canvasTemperatura.getContext('2d');
        ctxTemperatura.save(); // Salva o estado atual do canvas
        ctxTemperatura.globalCompositeOperation = 'destination-over';
        ctxTemperatura.fillStyle = '#fff'; // Define a cor de fundo
        ctxTemperatura.fillRect(0, 0, canvasTemperatura.width, canvasTemperatura.height);
        ctxTemperatura.restore(); 
    
        // Configura o fundo branco para o gráfico de clock
        var canvasClock = document.getElementById('clockChart');
        var ctxClock = canvasClock.getContext('2d');
        ctxClock.save();
        ctxClock.globalCompositeOperation = 'destination-over';
        ctxClock.fillStyle = '#fff';
        ctxClock.fillRect(0, 0, canvasClock.width, canvasClock.height);
        ctxClock.restore();
    }
    

    // Função para exibir o alerta
    function funcaoAlerta() {
        const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-success alert-dismissible fade show" role="alert">`,
            `   <div>Artefatos exportados com sucesso!</div>`,
            '</div>'
        ].join('');

        alertPlaceholder.append(wrapper);
        // Remove o alerta após 3 segundos
        setTimeout(() => {
            wrapper.remove();
        }, 3000);
    }
    

    
    // Função do botão principal que inicia/para/exporta
    document.getElementById('btnIniciar').addEventListener('click', function() {
        // Alterna o estado da coleta
        isCollecting = !isCollecting;

        // Atualiza a aparência do botão com base no estado atual
        toggleButton('btnIniciar', isCollecting);

        if (isCollecting) {
            // Inicia a coleta de temperatura e clock
            autoCollectTempIntervalId = setInterval(() => {
            fetchDataAndUpdateChart('http://localhost:3000/temperatura', 'temperatura', temperatureChart, 0);
            updateVisibility('temperatura');
        }, 1000);

            autoCollectClockIntervalId = setInterval(() => {
            fetchDataAndUpdateChart('http://localhost:3000/clock', 'clock', clockChart, 0);
            updateVisibility('clock');
        }, 1000);
            // Escreve no logcat
            toggleLogcat('write');
        } else {
            // Para a coleta de temperatura
            if (autoCollectTempIntervalId) {
                clearInterval(autoCollectTempIntervalId);
                autoCollectTempIntervalId = null;
            }

            // Para a coleta do clock
            if (autoCollectClockIntervalId) {
            clearInterval(autoCollectClockIntervalId);
            autoCollectClockIntervalId = null;
            }

            funcaoAlerta();
            toggleLogcat('clear');
            configuraFundoBrancoParaExportacao(); 
            // Salva as imagens do canvas antes de zipar junto ao logcat
            saveCanvasImage('temperatureChart', 'temperatureChart.png');
            saveCanvasImage('clockChart', 'clockChart.png');
            // Zipa e exporta os artefatos
            exportLogs();
        }
    });



});
