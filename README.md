# Mercado Financeiro — Painel p5.js

Este projeto contém um site simples e otimizado para visualização de preços usando p5.js. É ideal para clonar e enviar para um repositório novo.

Arquivos incluídos:
- `index.html` — estrutura HTML, meta tags, referência ao p5.js e sketch.
- `style.css` — estilos responsivos e limpos.
- `sketch.js` — código p5 otimizado (noLoop + redraw controlado, tooltip DOM, simulação).
- `data/sample_data.json` — dados de exemplo (JSON).

Como usar:
1. Crie um novo repositório no GitHub (ou pasta local).
2. Copie os arquivos para o diretório raiz do repo.
3. Faça commit e push:
   - git init
   - git add .
   - git commit -m "Site Mercado Financeiro p5.js"
   - git remote add origin <URL-do-repo>
   - git push -u origin main
4. Hospedagem:
   - Você pode servir diretamente com GitHub Pages (branch `main`/`gh-pages`).
   - Ou abrir `index.html` localmente (alguns navegadores bloqueiam loadJSON via file://; usar servidor local recomendado, ex: `python3 -m http.server`).

Personalização e próximos passos:
- Substituir `data/sample_data.json` por feed real (fetch/REST/WebSocket) e ajustar appendNewPrice para parse.
- Adicionar múltiplas séries (ações) e seleção via DOM.
- Exportar CSV / snapshots se necessário.

Observações de otimização:
- O sketch usa `noLoop()` e redesenha apenas quando necessário (interação ou simulação), reduzindo uso de CPU.
- A renderização do gráfico usa beginShape/vertex para performance.
- Mantém o histórico limitado para evitar crescimento ilimitado de memória.

Se quiser, eu posso:
- adaptar o layout para múltiplos gráficos;
- integrar um feed real (ex.: API pública) e exemplos de fetch;
- empacotar os arquivos e criar o repositório e commits diretamente (se você fornecer o repositório alvo).
