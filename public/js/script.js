document.addEventListener('DOMContentLoaded', function() {
    var tempChartCtx = document.getElementById('temperatureChart').getContext('2d');
    var clockChartCtx = document.getElementById('clockChart').getContext('2d');
    var autoCollectTempIntervalId, autoCollectClockIntervalId;

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
                document.getElementById(elementId).innerText = `${elementId === 'temperatura' ? 'Temperatura: ' : 'Clock Atual: '}${data[elementId]}${elementId === 'temperatura' ? '°C' : ' MHz'}`;
                var now = new Date().toLocaleTimeString();
                chart.data.labels.push(now);
                chart.data.datasets[datasetIndex].data.push(data[elementId]);
                chart.update();
            })
            .catch(error => console.error(`Erro ao buscar ${elementId}:`, error));
    }

    function toggleButton(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (isActive) {
            button.classList.remove('btn-success'); // Bootstrap class para green
            button.classList.add('btn-danger'); // Bootstrap class para red
            button.textContent = `Parar Coleta`;
        } else {
            button.classList.remove('btn-danger');
            button.classList.add('btn-success');
            button.textContent = `Iniciar Coleta`;
        }
    }
    
    
    // Configura o fundo branco para a imagem e exporta
    document.getElementById('btnExportLogs').addEventListener('click', function() {
        // Configura o fundo branco para a imagem exportada
        var canvas = document.getElementById('temperatureChart');
        var ctx = canvas.getContext('2d');
        ctx.save(); // Salva o estado atual do canvas
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#fff'; // Define a cor de fundo
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore(); // Restaura o estado do canvas
        
    
        // Faça o mesmo para o gráfico do clock
        var canvasClock = document.getElementById('clockChart');
        var ctxClock = canvasClock.getContext('2d');
        ctxClock.save(); 
        ctxClock.globalCompositeOperation = 'destination-over';
        ctxClock.fillStyle = '#fff'; 
        ctxClock.fillRect(0, 0, canvasClock.width, canvasClock.height);
        ctxClock.restore(); 
    });



    // Coleta a temperatura 
    document.getElementById('btnAutoTemperatura').addEventListener('click', function() {
        if (autoCollectTempIntervalId) {
            clearInterval(autoCollectTempIntervalId);
            autoCollectTempIntervalId = null;
            toggleButton('btnAutoTemperatura', false);
        } else {
            autoCollectTempIntervalId = setInterval(() => {
                fetchDataAndUpdateChart('http://localhost:3000/temperatura', 'temperatura', temperatureChart, 0);
                updateVisibility('temperatura');
            }, 1000); // Coleta a temperatura a cada 1 segundo
            toggleButton('btnAutoTemperatura', true);
        }
    });


    // Coleta o clock 
    document.getElementById('btnAutoClock').addEventListener('click', function() {
        if (autoCollectClockIntervalId) {
            clearInterval(autoCollectClockIntervalId);
            autoCollectClockIntervalId = null;
            toggleButton('btnAutoClock', false);
        } else {
            autoCollectClockIntervalId = setInterval(() => {
                fetchDataAndUpdateChart('http://localhost:3000/clock', 'clock', clockChart, 0);
                updateVisibility('clock');
            }, 1000); // Coleta o clock a cada 1 segundo
            toggleButton('btnAutoClock', true);
        }
    });

    // Apresenta o valor do clock e temperatura
    function updateVisibility(elementId) {
        var element = document.getElementById(elementId);
        if (element.textContent.trim() === '') {
            element.style.visibility = 'hidden';
        } else {
            element.style.visibility = 'visible';
        }
    }
    

    // Adiciona a função toggleLogcat aos manipuladores de eventos aos botões de iniciar captura
    document.getElementById('btnAutoTemperatura').addEventListener('click', function() {
        if (autoCollectTempIntervalId) {
            toggleLogcat('start');
        } else {
            toggleLogcat('stop');
        }
    });

    document.getElementById('btnAutoClock').addEventListener('click', function() {
        if (autoCollectClockIntervalId) {
            toggleLogcat('start');
        } else {
            toggleLogcat('stop');
        }
    });


    // Função para enviar uma requisição ao servidor para iniciar ou parar a coleta do logcat
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



    // Evento de clique para exportar logs e salvar imagens dos gráficos
    document.getElementById('btnExportLogs').addEventListener('click', function() {
        // Salva as imagens do canvas antes de zipar junto ao logcat
        saveCanvasImage('temperatureChart', 'temperatureChart.png');
        saveCanvasImage('clockChart', 'clockChart.png');
        exportLogs();
        
    });


    // Seleciona o elemento onde o alerta será inserido
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
    // Função para adicionar o alerta ao elemento
    const appendAlert = (message, type) => {
    const wrapper = document.createElement('div')
    // Conteúdo do HTML
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
        `   <div>${message}</div>`,
        //'   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        
        '</div>'
    ].join('')

    // Adiciona o alerta ao elemento
    alertPlaceholder.append(wrapper)
    setTimeout(() => {
        wrapper.remove()
    }, 3000)
    }

    // Seleciona o botão que aciona o alerta
    const alertTrigger = document.getElementById('btnExportLogs')

    // Adiciona um evento de clique ao botão
    if (alertTrigger) {
        alertTrigger.addEventListener('click', () => {
        appendAlert('Exportado com sucesso!', 'success')
    })
    }




});
