# FreshMarket — Frontend (HTML, CSS e JavaScript)

Projeto front-end simples de supermercado desenvolvido com **HTML5**, **CSS3** e **JavaScript puro (ES Modules)**, pronto para consumir uma API REST em **Java** (`http://localhost:8080/api`) via **CORS**.

## Bibliotecas e recursos utilizados
- **Lucide Icons** (`https://unpkg.com/lucide@latest`): biblioteca leve de ícones SVG incluída via CDN no `index.html`.
- **Google Fonts — Inter**: tipografia limpa carregada via CDN no `index.html`.
- **Fetch API nativa do navegador**: realiza requisições `GET /api/products` e `POST /api/orders` com `mode: 'cors'`.

## Como rodar o front
Basta abrir o `index.html` com um servidor estático simples (por exemplo, Live Server no VS Code ou `python3 -m http.server 5500`) para evitar bloqueios de origem em requisições CORS.
