// sketch.js — p5.js (modo global) otimizado para performance e readabilidade.
// Estrutura:
//  - preload() carrega dados estáticos
//  - setup() cria canvas e referências DOM
//  - noLoop() + update por timer para reduzir custo de draw por frame
//  - desenha gráfico com vertices (beginShape) para ser eficiente

let prices = [];         // array {t: timestamp(ms), v: price}
let canvasW = 0, canvasH = 0;
let padding = {l:50, r:20, t:20, b:40};
let simInterval = null;
let live = false;
let zoom = 1;
let gfx;                 // opcional buffer se quisermos otimizar
let tooltipDiv;

function preload(){
  // carrega arquivo JSON com dados iniciais
  // data/sample_data.json (deve existir no repo)
  try {
    prices = loadJSON('data/sample_data.json', ()=>{
      // converter para array se for object
      if (!Array.isArray(prices)) prices = Object.values(prices);
    });
  } catch (e) {
    // fallback: gerar dados locais
    prices = generateSampleData(60);
  }
}

function setup(){
  const parent = select('#canvas-container');
  canvasW = parent.width;
  canvasH = parent.height;

  const cnv = createCanvas(canvasW, canvasH);
  cnv.parent('canvas-container');
  cnv.canvas.setAttribute('role','img');
  noStroke();
  pixelDensity(1); // manter consistência e performance
  gfx = createGraphics(width, height);

  // criar tooltip DOM
  tooltipDiv = createDiv('').addClass('tooltip').style('display','none');
  tooltipDiv.parent(document.body);

  // DOM controls
  select('#btn-toggle-live').mousePressed(toggleLive);
  select('#zoom-range').input((e)=>{ zoom = parseFloat(e.target.value); redraw(); });

  // stats iniciais
  updateStats();

  // não desenhar a 60fps; desenhar apenas quando necessário
  noLoop();

  // manter ano no rodapé
  select('#year').html((new Date()).getFullYear());
}

function windowResized(){
  const parent = select('#canvas-container');
  resizeCanvas(parent.width, parent.height);
  gfx = createGraphics(width, height);
  redraw();
}

function draw(){
  background(7,18,33);
  // desenha área de gráfico com padding
  drawChart();
  drawOverlay();
}

// Desenha linha de preços, eixo e grid
function drawChart(){
  const w = width, h = height;
  // area útil
  const x0 = padding.l, x1 = w - padding.r;
  const y0 = padding.t, y1 = h - padding.b;
  const aw = (x1 - x0) * zoom;

  // filtrar últimos N pontos (ajustável)
  const maxPoints = Math.min(240, Math.max(30, Math.floor(60 * zoom)));
  const sliceData = prices.slice(-maxPoints);
  if (sliceData.length === 0) return;

  // calcular min/max
  let minV = Number.POSITIVE_INFINITY, maxV = Number.NEGATIVE_INFINITY;
  for (let i=0;i<sliceData.length;i++){
    const v = sliceData[i].v;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  // pequena margem visual
  const margin = (maxV - minV) * 0.08 || maxV * 0.02 || 1;
  minV -= margin; maxV += margin;

  // desenhar grid leve
  stroke(255,255,255,18);
  strokeWeight(1);
  for (let i=0;i<4;i++){
    const yy = map(i,0,3,y0,y1);
    line(x0,yy,x1,yy);
  }
  noStroke();

  // desenhar área do gráfico com preenchimento suave
  beginShape();
  fill(17,135,98,30);
  let first = true;
  for (let i=0;i<sliceData.length;i++){
    const x = map(i,0,sliceData.length-1,x0, x0 + aw);
    const y = map(sliceData[i].v, minV, maxV, y1, y0);
    if (first){ vertex(x,y); first=false } else vertex(x,y);
  }
  // fechar polígono até baseline
  vertex(x0 + aw, y1);
  vertex(x0, y1);
  endShape(CLOSE);

  // desenhar linha principal
  stroke(61,220,132);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i=0;i<sliceData.length;i++){
    const x = map(i,0,sliceData.length-1,x0, x0 + aw);
    const y = map(sliceData[i].v, minV, maxV, y1, y0);
    vertex(x,y);
  }
  endShape();

  // desenhar último ponto
  const last = sliceData[sliceData.length-1];
  const lastX = map(sliceData.length-1,0,sliceData.length-1,x0, x0 + aw);
  const lastY = map(last.v, minV, maxV, y1, y0);
  fill(255);
  noStroke();
  ellipse(lastX, lastY, 6,6);

  // desenhar eixos simples e labels
  fill(170);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);
  text(formatPrice(maxV), x0 + 6, y0 + 4);
  textAlign(LEFT, CENTER);
  text(formatPrice(minV), x0 + 6, y1 - 6);

  // atualizar stats
  select('#last-price').html(formatPrice(last.v));
  select('#points').html(sliceData.length);

  // armazenar para interação
  this._chart = {x0, x1: x0 + aw, y0, y1, sliceData, minV, maxV};
}

// camada com tooltip e informações adicionais
function drawOverlay(){
  // se mouse estiver sobre canvas, detectar ponto e mostrar tooltip
  if (!this._chart) return;
  const ch = this._chart;
  if (mouseX >= ch.x0 && mouseX <= ch.x1 && mouseY >= ch.y0 && mouseY <= ch.y1){
    // calcular índice aproximado
    const rel = (mouseX - ch.x0) / (ch.x1 - ch.x0);
    const idx = Math.round(rel * (ch.sliceData.length - 1));
    const item = ch.sliceData[idx];
    if (item){
      // desenhar linha vertical
      stroke(255,255,255,30); strokeWeight(1);
      line(constrain(mouseX, ch.x0, ch.x1), ch.y0, constrain(mouseX, ch.x0, ch.x1), ch.y1);
      noStroke();

      // tooltip DOM (melhor para texto e posicionamento)
      const tx = mouseX + 12;
      const ty = mouseY + 12;
      tooltipDiv.html(`<strong>${formatTime(item.t)}</strong><br>${formatPrice(item.v)}`);
      tooltipDiv.style('display','block')
                .style('left', (tx + 8) + 'px')
                .style('top', (ty + 8) + 'px');
      // variação entre primeiro e último
      const firstV = ch.sliceData[0].v;
      const lastV = ch.sliceData[ch.sliceData.length - 1].v;
      const pct = ((lastV - firstV) / firstV) * 100;
      select('#variation').html((pct>=0?'+':'') + pct.toFixed(02) + '%');
      return;
    }
  }
  tooltipDiv.style('display','none');
}

// Utilidades
function formatPrice(v){
  return 'R$ ' + Number(v).toFixed(2);
}
function formatTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

// Simulação: adiciona um novo ponto a cada segundo quando ativo
function toggleLive(){
  live = !live;
  const btn = select('#btn-toggle-live');
  btn.html(live ? 'Parar simulação' : 'Iniciar simulação');
  btn.elt.setAttribute('aria-pressed', String(live));
  if (live){
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(()=>{
      appendNewPrice();
      redraw();
    }, 1000);
  } else {
    if (simInterval) { clearInterval(simInterval); simInterval = null; }
  }
}

// Append novo preço baseado no último valor (simples random walk)
function appendNewPrice(){
  if (prices.length === 0) {
    prices = generateSampleData(60);
  } else {
    const last = prices[prices.length - 1].v;
    const vol = Math.max(0.2, Math.abs(last * 0.0025));
    const next = last + (random(-1,1) * vol);
    prices.push({t: Date.now(), v: Number(next.toFixed(2))});
    // manter tamanho máximo para performance
    if (prices.length > 1000) prices.splice(0, prices.length - 1000);
  }
  updateStats();
}

// Atualiza resumo do painel
function updateStats(){
  if (!prices || prices.length === 0) return;
  const last = prices[prices.length - 1].v;
  select('#last-price').html(formatPrice(last));
  select('#points').html(prices.length);
  // variação última janela
  const windowSize = Math.min(60, prices.length);
  const start = prices[prices.length - windowSize].v;
  const pct = ((last - start) / start) * 100;
  select('#variation').html((pct>=0?'+':'') + pct.toFixed(2) + '%');
}

// Gera dados de exemplo (linha suave)
function generateSampleData(n){
  const out = [];
  let t = Date.now() - n*1000;
  let v = 150 + random(-2,2);
  for (let i=0;i<n;i++){
    v += random(-0.8,0.8);
    out.push({t: t + i*1000, v: Number(v.toFixed(02))});
  }
  return out;
}

// Evento mouse move sobre o canvas para redraw mínimo
function mouseMoved(){
  // só redesenhar quando o mouse estiver sobre o canvas (p5 cuida das coordenadas)
  if (mouseY >= 0 && mouseY <= height && mouseX >=0 && mouseX <= width){
    redraw();
  }
}

// limpando tooltip ao sair
function mouseOut(){
  tooltipDiv.style('display','none');
}
