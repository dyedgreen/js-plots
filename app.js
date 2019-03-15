"use strict";

class Plot extends HTMLElement {

  constructor(data) {
    // Html element busywork
    super();
    this.cnv = document.createElement("canvas");
    this.appendChild(this.cnv);
    window.onresize = Plot.shareEvent(Plot.debounce(() => this.resize(), 50), window.onresize);
    window.requestAnimationFrame(() => this.resize());
    // Canvas and style
    this.ctx = this.cnv.getContext("2d", {alpha: false});
    this.aspectRatio = 0.8; // Canvas aspect ratio
    this.decorationColor = "#BBBBBB";
    this.backgroundColor = "#FFFFFF";
    this.textColor = "#000000";
    this.lineWidth = 2;
    this.yTicks = 5;
    this.ySnap = true; // Snap ticks to nearest (good) multiple
                       // set to specific value to set this multiple
    this.xTicks = 6;
    this.fontSize = 12;
    this.fontHeight = 20;
    // Render state
    this.hidden = {};
    // Caches
    this.cacheFull = null;
    this.cacheFullW = 0;
    this.cacheFullH = 0;
    // Animation state
    // TODO
    // Default css
    this.style.display = "block";
    this.style.overflow = "hidden";
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
  }

  resize() {
    const w = Math.floor(this.offsetWidth);
    const h = Math.floor(w * this.aspectRatio);
    this.cnv.width = Math.floor(w * Plot.pixelRatio);
    this.cnv.height = Math.floor(h * Plot.pixelRatio);
    this.cnv.style.width = `${w}px`;
    this.cnv.style.height = `${h}px`;
    this.style.height = `${h}px`;
    // FIXME: REDRAW canvas
    this.show();
  }

  show() {
    const a = 27, b = 60;
    this.render(a, b, this.x[a], this.x[b], true);
    this.renderHighlight(45);
  }

  /**
  * render()
  *
  * Draw the basic plot with
  * optional axis. This is
  * considered a low-level
  * operation.
  */
  render(from, to, xMin, xMax, axis) {
    // Determine layout
    let yMin = axis ? 0 : +Infinity;
    let yMax = axis ? 0 : -Infinity;
    for (let i = 0; i < this.y.length; i ++) {
      if (this.hidden[this.names[i]]) continue;
      for (let j = from; j <= to; j ++) {
        const tmp = this.y[i][j];
        yMin = yMin > tmp ? tmp : yMin;
        yMax = yMax < tmp ? tmp : yMax;
      }
    }

    // Cache these for highlight
    this.__cacheXMin__ = xMin;
    this.__cacheXMax__ = xMax;
    this.__cacheYMin__ = yMin;
    this.__cacheYMax__ = yMax;
    this.__cacheFrom__ = from;
    this.__cacheTo__   = to;

    const offset = this.fontHeight * Plot.pixelRatio;
    const fontOffset = (this.fontHeight - this.fontSize) / 2 * Plot.pixelRatio;
    let   ySpacing = (yMax - yMin) / this.yTicks; // in y-units
    const xSpacing = (xMax - xMin) / this.xTicks; // in x-units
    const yScale = (this.cnv.height-2*offset) / (yMax - yMin);
    const xScale = (this.cnv.width) / (xMax - xMin);

    // Snap spacing
    if (typeof this.ySnap === "number") ySpacing = Math.floor(ySpacing / this.ySnap) * this.ySnap;
    if (this.ySnap === true) {
      // Auto-Snap
      let s = 10;
      if (yMax > 100000) { s = 10000; }
      else if (yMax > 10000) { s = 1000; }
      else if (yMax > 1000) { s = 100; }
      ySpacing = Math.floor(ySpacing / s) * s;
    }

    // Render background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);

    if (axis) {
      this.ctx.font = `${this.fontSize * Plot.pixelRatio}px 'Roboto', sans-serif`;
      this.ctx.fillStyle = this.decorationColor;
      this.ctx.strokeStyle = this.decorationColor;
      this.ctx.lineWidth = Plot.pixelRatio;

      this.ctx.beginPath();
      for (let i = 0; i <= this.yTicks; i ++) {
        const h = this.cnv.height - (offset + yScale*ySpacing*i)
        this.ctx.moveTo(0,              h);
        this.ctx.lineTo(this.cnv.width, h);
        this.ctx.fillText(`${Math.floor(ySpacing*i)}`, 0, h - fontOffset);
      }
      this.ctx.stroke();

      for (let i = 0; i < this.xTicks; i ++) {
        this.ctx.fillText(
          `${Plot.monthDay(Math.floor(xSpacing*i))}`,
          xScale*xSpacing*i,
          this.cnv.height - fontOffset
        );
      }
    }

    // Render plot
    this.ctx.lineWidth = this.lineWidth * Plot.pixelRatio;
    this.ctx.lineCap = "flat";
    this.ctx.lineJoin = "round";

    for (let i = 0; i < this.y.length; i ++) {
      if (this.hidden[this.names[i]]) continue;
      this.ctx.strokeStyle = this.colors[i];
      this.ctx.beginPath();
      this.ctx.moveTo(0, (yMax-this.y[i][from])*yScale + offset);
      for (let j = from; j <= to; j ++) {
        this.ctx.lineTo(
          (this.x[j]-xMin)*xScale,
          (yMax-this.y[i][j])*yScale + offset
        );
      }
      this.ctx.stroke();
    }
  }

  /**
  * renderHighlight()
  *
  * Highlight a specific
  * data point. This is
  * considered a low-level
  * operation. This assumes
  * the underlying plot was
  * drawn with axis.
  */
  renderHighlight(i) {
    // Restore values
    const xMin = this.__cacheXMin__;
    const xMax = this.__cacheXMax__;
    const yMin = this.__cacheYMin__;
    const yMax = this.__cacheYMax__;
    const from = this.__cacheFrom__;
    const to   = this.__cacheTo__;

    if (i < from || i > to) throw "Index error";

    const offset = this.fontHeight * Plot.pixelRatio;
    const fontOffset = (this.fontHeight - this.fontSize) / 2 * Plot.pixelRatio;
    const yScale = (this.cnv.height-2*offset) / (yMax - yMin);
    const xScale = (this.cnv.width) / (xMax - xMin);

    const xPos = (this.x[i]-xMin)*xScale;
    const radius = this.lineWidth * Plot.pixelRatio * 2.2;

    // Render background line
    this.ctx.strokeStyle = this.decorationColor;
    this.ctx.lineWidth = Plot.pixelRatio;

    this.ctx.beginPath();
    this.ctx.moveTo(xPos, offset);
    this.ctx.lineTo(xPos, this.cnv.height - offset);
    this.ctx.stroke();

    // Render dots
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.lineWidth = this.lineWidth * Plot.pixelRatio;

    for (let j = 0; j < this.y.length; j ++) {
      if (this.hidden[this.names[j]]) continue;
      this.ctx.strokeStyle = this.colors[j];
      this.ctx.beginPath();
      this.ctx.ellipse(xPos, (yMax-this.y[j][i])*yScale + offset, radius, radius, 0, 0, 2*Math.PI);
      // console.log(xPos, (yMax-this.y[j][i])*yScale, offset, offset);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Measure box
    const fontTitle = `${this.fontSize * Plot.pixelRatio * 1.5}px 'Roboto', sans-serif`;
    const fontData = `${this.fontSize * Plot.pixelRatio * 2}px 'Roboto', sans-serif`;
    const fontName = `${this.fontSize * Plot.pixelRatio}px 'Roboto', sans-serif`;

    const title = `${Plot.weekDay(this.x[i])}, ${Plot.monthDay(this.x[i])}`;
    this.ctx.font = fontTitle;
    let m = this.ctx.measureText(title);
    let width = m.width;
    let height = m.height;
    let heights = [m.height];

    for (let j = 0; j < this.y.length; j ++) {
      if (this.hidden[this.names[j]]) continue;
      this.ctx.font = fontData;
      m = this.ctx.measureText("".concat(this.y[j][i]));
      width = Math.max(width, m.width);
      height += m.height;
      heights.push(m.height);
      this.ctx.font = fontName;
      m = this.ctx.measureText(this.names[j]);
      width = Math.max(width, m.width);
      height += m.height;
      heights.push(m.height);
    }

    // Render box
    this.ctx.beginPath();

    // Render text
  }

  setCache() {
    this.cacheFull = this.ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
    this.cacheFullW = this.cnv.width;
    this.cacheFullH = this.cnv.height;
  }

  restoreCache() {
    if (this.cacheFull && this.cacheFullW === this.cnv.width && this.cacheFullH === this.cnv.height) {
      this.ctx.putImageData(this.cacheFull, 0, 0);
      return true;
    }
    return false;
  }

  static weekDay(unix) {
    const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(+unix);
    return w[d.getDay()];
  }

  static monthDay(unix) {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(+unix);
    return `${m[d.getMonth()]} ${d.getDate()}`;
  }

  static debounce(fn, interval) {
    interval = interval || 10;
    let timeout = undefined;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(fn, interval);
    };
  }

  static shareEvent(fn, prev) {
    if (typeof prev === "function") {
      return () => {prev();fn();};
    }
    return fn;
  }

  static get pixelRatio() {
    if (!Plot.__pixelRatio__) {
      const ctx = document.createElement("canvas").getContext("2d");
      const dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
                  ctx.mozBackingStorePixelRatio ||
                  ctx.msBackingStorePixelRatio ||
                  ctx.oBackingStorePixelRatio ||
                  ctx.backingStorePixelRatio || 1;
      Plot.__pixelRatio__ = dpr / bsr;
    }
    return Plot.__pixelRatio__;
  }

}
customElements.define("plot-base", Plot);

class PlotView extends HTMLElement {

  constructor() {
    super();
    // Loading state (initial)
    this.innerHTML = "<h1 class='loading'>Loading ...</h1>";
    // Events
    this.onready = () => {};
    // Load data
    PlotView.loadJson(this.json, charts => {
      // Plots
      this.plotBig = new Plot(charts[0], this.canvBig);
      // Setup html
      this.innerHTML = "";
      this.appendChild(this.plotBig);
      // FIXME
      setTimeout(() => {this.plotBig.show()}, 5);
      this.onready();
    });
    console.log(this.style["test-prop"]);
  }

  static loadJson(path, callback) {
    // FIXME
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

}
customElements.define("plot-view", PlotView);
