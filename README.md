<h1>
<br> Android Monitor <br>
</h1>


Solução para monitorar em tempo real a temperatura e o clock do processador de dispositivos Android, além de coletar logs do sistema para análise.


<p align="center">
  <img alt="Spaceship with Hyper and One Dark" src="https://github.com/Maaacs/Android-Monitors/assets/56925726/d4466860-bcd5-4bac-bdea-a163a1ddd226" width="980px">
</p>



## Recursos

- Coleta de dados em tempo real da temperatura e clock do processador.
- Exibição dos dados coletados em gráficos intuitivos.
- Coleta automática de dados com a capacidade de iniciar e parar a coleta.
- Exportação dos dados coletados e gráficos em forma de um arquivo ZIP.

## Tecnologias Utilizadas

- Node.js e Express para o servidor backend.
- ADB (Android Debug Bridge) para coleta de dados do dispositivo.
- Bootstrap como framework front-end.
- Chart.js para renderizar os gráficos no frontend.
- Archiver para criar arquivos ZIP para exportação.

## Configuração do Projeto

### Pré-requisitos

- Node.js (versão recomendada: 14.x ou superior)
- ADB instalado e configurado no seu sistema
- Dispositivo Android em root conectado ao computador onde o servidor será executado

### Instalação

1. Clone o repositório para sua máquina local:

   ```bash
   git clone https://github.com/Maaacs/Android-Monitor
   ```

2. Navegue para a pasta do projeto e instale as dependências:

   ```bash
   cd Android-Monitor
   npm install
   ```

3. Inicie o servidor:

   ```bash
   npm start
   ```

O servidor agora deve estar rodando e acessível em `http://localhost:3000`.

## Uso

- Acesse `http://localhost:3000` através de um navegador web para visualizar a interface do usuário.
- Use o botão "Iniciar" para a coleta contínua de dados.
- Clique em "Parar" para baixar o arquivo ZIP contendo os gráficos e logs do dispositivo. Os artefatos vão para `src/outputs`.

## Endpoints do Servidor

- `GET /temperatura`: Retorna a temperatura atual do dispositivo em graus Celsius.
- `GET /clock`: Retorna o clock atual do processador em MHz.
- `GET /logcat`: Inicia ou para a coleta do logcat, dependendo do parâmetro action que pode ser start ou stop
- `GET /export-logs`: Exporta os gráficos e logs coletados em um arquivo ZIP.
- `GET /nomeDispositivo`: Retorna o nome do dispositivo.
- `GET /build-version`: Retorna a versão da build do sistema.

## Contribuindo

Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Adicione suas mudanças (`git add .`)
4. Faça o Commit de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Faça o Push da Branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request


## Contato

- [Linkedin](https://www.linkedin.com/in/max-souza-4533b6196/)

- [Github](https://github.com/seu_usuario/projeto-monitoramentohttps://github.com/Maaacs)