"use strict";

class Plot extends HTMLElement {

  constructor(data) {
    // Html element busywork
    super();
    this.cnv = document.createElement("canvas");
    this.appendChild(this.cnv);
    window.onresize = Plot.shareEvent(() => window.requestAnimationFrame(() => this.resize()), window.onresize);
    window.requestAnimationFrame(() => this.resize());
    this.cnv.onmousemove = (e) => window.requestAnimationFrame(() => this.onpointermove(e));
    this.cnv.onmouseenter = () => this.onhover(true);
    this.cnv.onmouseleave = () => this.onhover(false);
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
    this.axis = true; // Display axis and hover info
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
    // Render state
    this.hiddenPlots = {};
    this.from = 0;
    this.to = this.x.length - 1;
    this.hovered = false;
    // Caches
    this.cacheFull = null;
    this.cacheFullW = 0;
    this.cacheFullH = 0;
    this.cacheFullFrom = this.from;
    this.cacheFullTo = this.to;
  }

  togglePlot(index, animate) {
    this.hiddenPlots[this.names[index]] = !this.hiddenPlots[this.names[index]];
    if (animate) {
      this.animate();
    } else {
      this.invalidateCache();
      this.show();
    }
  }

  setFromTo(from, to, animate) {
    // Select from and to
    this.from = Math.max(0, from);
    this.to = Math.min(this.x.length, to);
    if (animate) {
      this.animate();
    } else {
      this.invalidateCache();
      this.show();
    }
  }

  resize() {
    const w = Math.floor(this.offsetWidth);
    const h = Math.floor(w * this.aspectRatio);
    this.cnv.width = Math.floor(w * Plot.pixelRatio);
    this.cnv.height = Math.floor(h * Plot.pixelRatio);
    this.cnv.style.width = `${w}px`;
    this.cnv.style.height = `${h}px`;
    this.style.height = `${h}px`;
    this.show();
  }

  /**
  * show()
  *
  * Updates the render
  * and does appropriate
  * caching.
  */
  show() {
    if (!this.restoreCache()) {
      this.render(this.from, this.to, this.axis);
      this.setCache();
    }
    // Render highlight if hovered
    if (this.hovered && this.axis) {
      this.renderHighlight(this.hoverIndex);
    }
  }

  /**
  * animate()
  *
  * Like show, but with an
  * animation.
  */
  animate(step) {
    step = step || 0.1;
    let progress = 0;
    let closure = () => {
      if (progress < 1) {
        this.render(this.from, this.to, this.axis, progress);
        progress += 0.1;
        window.requestAnimationFrame(closure);
      } else {
        this.invalidateCache();
        this.show();
      }
    };
    window.requestAnimationFrame(closure);
  }

  onpointermove(event) {
    if (!this.axis) return;
    // Determine highlight point
    this.hoverIndex = (event.clientX - this.cnv.getBoundingClientRect().left) / this.cnv.offsetWidth;
    this.hoverIndex = Math.floor(this.hoverIndex * (this.to-this.from) + this.from);
    this.show();
  }

  onhover(hovered) {
    if (!this.axis) return;
    this.hovered = !!hovered;
    this.show();
  }

  /**
  * render()
  *
  * Draw the basic plot with
  * optional axis. This is
  * considered a low-level
  * operation.
  */
  render(from, to, axis, animBounds) {
    // Determine layout
    let yMin = axis ? 0 : +Infinity;
    let yMax = axis ? 0 : -Infinity;
    for (let i = 0; i < this.y.length; i ++) {
      if (this.hiddenPlots[this.names[i]]) continue;
      for (let j = from; j <= to; j ++) {
        const tmp = this.y[i][j];
        yMin = yMin > tmp ? tmp : yMin;
        yMax = yMax < tmp ? tmp : yMax;
      }
    }
    let xMin = this.x[from];
    let xMax = this.x[to];

    // Animation easing of bounds
    if (typeof animBounds === "number") {
      from = Math.min(from, this.__cacheFrom__);
      to = Math.max(to, this.__cacheTo__);
      yMin = (yMin - this.__cacheYMin__) * animBounds + this.__cacheYMin__;
      yMax = (yMax - this.__cacheYMax__) * animBounds + this.__cacheYMax__;
      xMin = (xMin - this.__cacheXMin__) * animBounds + this.__cacheXMin__;
      xMax = (xMax - this.__cacheXMax__) * animBounds + this.__cacheXMax__;
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
    let   yTicks = this.yTicks;
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
      else if (yMax > 100) { s = 10; }
      else if (yMax > 10) { s = 0.1; }
      ySpacing = Math.floor(ySpacing / s) * s;
      yTicks = Math.floor(yMax / ySpacing);
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
      for (let i = 0; i <= yTicks; i ++) {
        const h = this.cnv.height - (offset + yScale*ySpacing*i)
        this.ctx.moveTo(0,              h);
        this.ctx.lineTo(this.cnv.width, h);
        this.ctx.fillText(`${Math.floor(ySpacing*i)}`, 0, h - fontOffset);
      }
      this.ctx.stroke();

      for (let i = 0; i < this.xTicks; i ++) {
        this.ctx.fillText(
          `${Plot.monthDay(Math.floor(xSpacing*i + xMin))}`,
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
      if (this.hiddenPlots[this.names[i]]) continue;
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
      if (this.hiddenPlots[this.names[j]]) continue;
      this.ctx.strokeStyle = this.colors[j];
      this.ctx.beginPath();
      this.ctx.ellipse(xPos, (yMax-this.y[j][i])*yScale + offset, radius, radius, 0, 0, 2*Math.PI);
      // console.log(xPos, (yMax-this.y[j][i])*yScale, offset, offset);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Measure box
    const fontTitle = `${this.fontSize * Plot.pixelRatio * 1.2}px 'Roboto', sans-serif`;
    const fontData = `${this.fontSize * Plot.pixelRatio * 1.5}px 'Roboto', sans-serif`;
    const fontName = `${this.fontSize * Plot.pixelRatio}px 'Roboto', sans-serif`;
    const padding = 0.4 * this.fontHeight * Plot.pixelRatio;

    const title = `${Plot.weekDay(this.x[i])}, ${Plot.monthDay(this.x[i])}`;
    this.ctx.font = fontTitle;
    let m = this.ctx.measureText(title);
    let width = padding;

    for (let j = 0; j < this.y.length; j ++) {
      if (this.hiddenPlots[this.names[j]]) continue;
      this.ctx.font = fontData;
      const w = this.ctx.measureText("".concat(this.y[j][i])).width;
      this.ctx.font = fontName;
      width += Math.max(w, this.ctx.measureText(this.names[j]).width);
      width += padding;
    }
    width = Math.max(width, m.width+2*padding);

    let xBox = xPos - offset;
    const yBox = offset;
    const lineHeight = this.fontHeight * Plot.pixelRatio;
    const hBox = lineHeight * 3.6;

    if (xBox + width > this.cnv.width - offset) {
      xBox = this.cnv.width - offset - width;
    } else if (xBox < offset) {
      xBox = offset;
    }

    // Render box
    const borderRadius = 3*Plot.pixelRatio;
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = "rgba(0,0,0,0.2)";

    this.ctx.beginPath();
    this.ctx.moveTo(xBox + borderRadius, yBox);
    this.ctx.lineTo(xBox + width - borderRadius, yBox);
    this.ctx.quadraticCurveTo(xBox + width, yBox, xBox + width, yBox + borderRadius);
    this.ctx.lineTo(xBox + width, yBox + hBox - borderRadius);
    this.ctx.quadraticCurveTo(xBox + width, yBox + hBox, xBox + width - borderRadius, yBox + hBox);
    this.ctx.lineTo(xBox + borderRadius, yBox + hBox);
    this.ctx.quadraticCurveTo(xBox, yBox + hBox, xBox, yBox + hBox - borderRadius);
    this.ctx.lineTo(xBox, yBox + borderRadius);
    this.ctx.quadraticCurveTo(xBox, yBox, xBox + borderRadius, yBox);

    this.ctx.fill();
    this.ctx.shadowColor = "rgba(0,0,0,0)";

    // Render text
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = fontTitle;
    this.ctx.fillText(title, xBox + padding, yBox + lineHeight);

    for (let j = 0, x = xBox; j < this.y.length; j ++) {
      if (this.hiddenPlots[this.names[j]]) continue;
      this.ctx.fillStyle = this.colors[j];
      this.ctx.font = fontData;
      const text = `${this.y[j][i]}`;
      const w = this.ctx.measureText(`${this.y[j][i]}`).width;
      this.ctx.fillText(text, x + padding, yBox + lineHeight*2.6);
      this.ctx.font = fontName;
      this.ctx.fillText(this.names[j], x + padding, yBox + lineHeight*3.2);
      x += padding + Math.max(this.ctx.measureText(this.names[j]).width, w);
    }
  }

  setCache() {
    this.cacheFull = this.ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
    this.cacheFullW = this.cnv.width;
    this.cacheFullH = this.cnv.height;
    this.cacheFullFrom = this.from;
    this.cacheFullTo = this.to;
  }

  restoreCache() {
    if (
      this.cacheFull &&
      this.cacheFullW === this.cnv.width && this.cacheFullH === this.cnv.height &&
      this.cacheFullFrom === this.from && this.cacheFullTo === this.to
    ) {
      this.ctx.putImageData(this.cacheFull, 0, 0);
      return true;
    }
    return false;
  }

  invalidateCache() {
    this.cacheFull = null;
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
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), interval);
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


class PlotOutline extends Plot {

  constructor(data) {
    super(data);
    // Override default behavior
    this.axis = false;
    this.fontHeight = 5;
    this.aspectRatio = 0.12;
    // Extend events
    this.cnv.onmousedown = () => {this.onclick(true)};
    this.cnv.onmouseup = () => {this.onclick(false)};
    this.cnv.ontouchmove = (e) => {this.ontouchmove(e)};
    // Extend
    this.boxColor = "#DDEAF3";
    this.boxBackgroundColor = "RGBA(221,234,243,0.5)";
    // Range status
    this.rangeFrom = this.from;
    this.rangeTo = this.to;
    // Callbacks
    this.onrangechange = () => {}; // Called when selected range changes
  }

  setRange(from, to) {
    this.rangeFrom = from;
    this.rangeTo = to;
    this.show();
    this.onrangechange();
  }

  /**
  * show()
  *
  * Updates the render
  * and does appropriate
  * caching.
  */
  show() {
    if (!this.restoreCache()) {
      this.render(this.from, this.to, this.axis);
      this.setCache();
    }
    this.renderBox(this.rangeFrom, this.rangeTo);
  }

  /**
  * animate()
  *
  * Like show, but with an
  * animation.
  */
  animate(step) {
    step = step || 0.1;
    let progress = 0;
    let closure = () => {
      if (progress < 1) {
        this.render(this.from, this.to, this.axis, progress);
        this.renderBox(this.rangeFrom, this.rangeTo);
        progress += 0.1;
        window.requestAnimationFrame(closure);
      } else {
        this.invalidateCache();
        this.show();
      }
    };
    window.requestAnimationFrame(closure);
  }

  onpointermove(event) {
    if (!this.clicked) return;
    // Determine highlight point
    let hover = (event.clientX - this.cnv.getBoundingClientRect().left) / this.cnv.offsetWidth;
    hover = Math.floor(hover * (this.to-this.from) + this.from);
    // Determine if handle, drag, or none (and update)
    const hitWidth = Math.ceil(this.x.length / 20);
    if (Math.abs(hover-this.rangeFrom) < hitWidth) {
      this.rangeFrom = Math.min(hover, this.rangeTo-hitWidth);
    } else if (Math.abs(hover-this.rangeTo) < hitWidth) {
      this.rangeTo = hover;
    } else if (hover > this.rangeFrom && hover < this.rangeTo) {
      const w = Math.floor((this.rangeTo - this.rangeFrom) / 2);
      this.rangeFrom = Math.max(0, hover - w);
      this.rangeTo = Math.min(this.x.length-1, hover + w);
    } else {
      return;
    }
    this.show();
    this.onrangechange();
  }

  ontouchmove(event) {
    event.preventDefault();
    this.clicked = true;
    this.onpointermove(event.touches.item(0));
  }

  onclick(clicked) {
    this.clicked = !!clicked;
  }

  /**
  * renderBox()
  *
  * Highlight box over
  * from -> to range, as
  * opposed to previously
  * rendered graph.
  */
  renderBox(from, to) {
    // Restore values
    const xMin     = this.__cacheXMin__;
    const xMax     = this.__cacheXMax__;
    const yMin     = this.__cacheYMin__;
    const yMax     = this.__cacheYMax__;
    const fromPrev = this.__cacheFrom__;
    const toPrev   = this.__cacheTo__;

    if (from < fromPrev || to > toPrev) throw "Index error";

    const xScale = (this.cnv.width) / (xMax - xMin);
    const handleWidth = 6 * Plot.pixelRatio;
    const borderWidth = 2 * Plot.pixelRatio;

    // Render background
    this.ctx.fillStyle = this.boxBackgroundColor;
    this.ctx.beginPath();
    this.ctx.rect(0, 0, (this.x[from]-xMin)*xScale, this.cnv.height);
    this.ctx.rect((this.x[to]-xMin)*xScale, 0, this.cnv.width, this.cnv.height);
    this.ctx.fill();

    // Render box
    this.ctx.fillStyle = this.boxColor;
    this.ctx.beginPath();
    this.ctx.rect((this.x[from]-xMin)*xScale - handleWidth, 0, handleWidth, this.cnv.height);
    this.ctx.rect((this.x[to]-xMin)*xScale, 0, handleWidth, this.cnv.height);
    this.ctx.rect((this.x[from]-xMin)*xScale, 0, (this.x[to]-this.x[from])*xScale, borderWidth);
    this.ctx.rect((this.x[from]-xMin)*xScale, this.cnv.height-borderWidth, (this.x[to]-this.x[from])*xScale, borderWidth);
    this.ctx.fill();
  }

}
customElements.define("plot-outline", PlotOutline);


class PlotApp extends HTMLElement {

  constructor() {
    super();
    // Loading state (initial)
    // TODO
    // Events
    this.onready = () => {};
    // Load data
    PlotApp.loadJson(this.dataset.json, charts => {
      // Plots
      this.heroPlot = new Plot(charts[+this.dataset.chart]);
      this.scrollPlot = new PlotOutline(charts[+this.dataset.chart]);
      this.scrollPlot.onrangechange = () => {
        this.heroPlot.setFromTo(this.scrollPlot.rangeFrom, this.scrollPlot.rangeTo);
      };
      // Set nice starting range
      this.scrollPlot.setRange(
        Math.max(0, this.scrollPlot.x.length-41),
        Math.min(this.scrollPlot.x.length, this.scrollPlot.x.length-11)
      );
      // Setup html
      this.appendChild(this.heroPlot);
      this.appendChild(this.scrollPlot);
      // Set up buttons
      this.hiddenCount = 0;
      this.heroPlot.names.forEach((name, i) => {
        let button = document.createElement("a");
        let icon = document.createElement("span");
        icon.classList.add("icon");
        icon.style.backgroundColor = this.heroPlot.colors[i];
        button.appendChild(icon);
        button.classList.add("checked");
        button.innerHTML = button.innerHTML + name;
        button.onclick = () => {
          if (button.classList.contains("checked") && this.hiddenCount > this.heroPlot.y.length - 2) {
            // At least one plot has to be visible
            return;
          }
          button.classList.toggle("checked");
          this.heroPlot.togglePlot(i, true);
          this.scrollPlot.togglePlot(i, true);
          this.hiddenCount += button.classList.contains("checked") ? -1 : +1;
        }
        this.appendChild(button);
      });
      // Send ready event
      this.onready();
    });
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

}
customElements.define("plot-app", PlotApp);
