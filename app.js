"use strict";

class Plot {

  constructor(data, cnv) {
    // Load data
    this.x = [];
    this.y = [];
    this.names = [];
    this.colors = [];
    data.columns.forEach(col => {
      let id = col[0];
      if (data.types[id] === "x") {
        this.x = col.slice(1);
      } else {
        this.y.push(col.slice(1));
        this.names.push(data.names[id]);
        this.colors.push(data.colors[id]);
      }
    });
    // Canvas and style
    this.ctx = cnv.getContext("2d");
    this.cnv = cnv;
    this.decorationColor = "#BBBBBB";
    this.backgroundColor = "#FFFFFF";
    this.yLines = 5;
    this.fontSize = 10;
    // Render state
    this.hidden = {};
    // Caches
    // TODO
    // Animation state
    // TODO
  }

  show() {
    this.render(0, this.x.length-1, this.x[0], this.x[this.x.length-1]);
  }

  render(from, to, xMin, xMax) {
    // Note: x-> ; y \/
    // Determine min / max in y
    let yMin = +Infinity;
    let yMax = -Infinity;
    for (let i = 0; i < this.y.length; i ++) {
      if (this.hidden[this.names[i]]) continue;
      for (let j = from; j <= to; j ++) {
        const tmp = this.y[i][j];
        yMin = yMin > tmp ? tmp : yMin;
        yMax = yMax < tmp ? tmp : yMax;
      }
    }
    // Render background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
    const spacing = 0;
    const offset = this.fontSize * PlotView.pixelRatio;

    // Render plot
    const yScale = (this.cnv.height-2*offset) / (yMax - yMin);
    const xScale = (this.cnv.width-2*offset) / (xMax - xMin);

    this.ctx.lineWidth = 3 * PlotView.pixelRatio;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    for (let i = 0; i < this.y.length; i ++) {
      if (this.hidden[this.names[i]]) continue;
      this.ctx.strokeStyle = this.colors[i];
      this.ctx.beginPath();
      this.ctx.moveTo(0, (yMax-this.y[i][0])*yScale);
      for (let j = from; j <= to; j ++) {
        this.ctx.lineTo(
          Math.floor((this.x[j]-xMin)*xScale),
          (yMax-this.y[i][j])*yScale
        );
      }
      this.ctx.stroke();
    }
  }

}

class PlotView extends HTMLElement {

  constructor() {
    super();
    // Initialize doom
    this.innerHTML = "<canvas>Your browser is not supported :(</canvas><canvas></canvas><span></span>";
    //this.buttonTemplate = "TODO";
    this.canvBig = this.childNodes[0];
    this.canvPan = this.childNodes[1];
    this.buttonHolder = this.childNodes[2];
    // Observe resizes
    let onresize = window.onresize;
    window.onresize = onresize === "function" ?
      () => {onresize();this.resize()} :
      () => {this.resizeCanvas()};
    setTimeout(() => {this.resize();}, 5);
    // Plots
    this.plotBig = null;
    this.plotPan = null;
    // Events
    this.onready = () => {};
    // Rendering state
    // Load data
    PlotView.loadJson(this.json, charts => {
      this.plotBig = new Plot(charts[0], this.canvBig);
      setTimeout(() => {this.plotBig.show()}, 5);
    });
  }

  resize() {
    PlotView.sizeCanvas(this.canvBig, this.offsetWidth, this.offsetWidth * 0.8);
  }

  renderPlot(ctx, ) {

  }

  updatePlot() {

  }

  static loadJson(path, callback) {
    // let req = new XMLHttpRequest();
    // req.loadend = data => {
    //   data = JSON.parse(data);
    //   callback(data);
    // };
    // req.error = () => {
    //   throw "Could not load plot data";
    // };
    // req.open("GET", path);
    // req.send();
    // Load using js, since cross-origin does not work
    // nicely with local files
    callback(chart_data);
  }

  static get pixelRatio() {
    if (!PlotView.__pixelRatio__) {
      const ctx = document.createElement("canvas").getContext("2d");
      const dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
                  ctx.mozBackingStorePixelRatio ||
                  ctx.msBackingStorePixelRatio ||
                  ctx.oBackingStorePixelRatio ||
                  ctx.backingStorePixelRatio || 1;
      PlotView.__pixelRatio__ = dpr / bsr;
    }
    return PlotView.__pixelRatio__;
  }

  static sizeCanvas(canv, w, h) {
    canv.width = w * PlotView.pixelRatio;
    canv.height = h * PlotView.pixelRatio;
    canv.style.width = `${w}px`;
    canv.style.height = `${h}px`;
  }

}
customElements.define("plot-view", PlotView);
