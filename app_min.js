"use strict";class Plot extends HTMLElement{constructor(t){super(),this.cnv=document.createElement("canvas"),this.appendChild(this.cnv),window.onresize=Plot.shareEvent(()=>window.requestAnimationFrame(()=>this.resize()),window.onresize),window.requestAnimationFrame(()=>this.resize()),this.cnv.onmousemove=(t=>window.requestAnimationFrame(()=>this.onpointermove(t))),this.cnv.ontouchmove=(t=>{this.ontouchmove(t)}),this.cnv.onmouseenter=(()=>this.onhover(!0)),this.cnv.onmouseleave=(()=>this.onhover(!1)),this.cnv.onmousedown=(()=>{this.onclick(!0)}),this.cnv.onmouseup=(()=>{this.onclick(!1)}),this.onrangechange=(()=>{}),this.ctx=this.cnv.getContext("2d",{alpha:!1}),this.aspectRatio=.8,this.lineWidth=2,this.yTicks=5,this.ySnap=!0,this.xTicks=6,this.fontSize=12,this.fontHeight=20,this.axis=!0,this.toggleDarkColors(!0),this.style.display="block",this.style.overflow="hidden",this.x=[],this.y=[],this.names=[],this.colors=[],t.columns.forEach(i=>{let h=i[0];"x"===t.types[h]?this.x=i.slice(1):(this.y.push(i.slice(1)),this.names.push(t.names[h]),this.colors.push(t.colors[h]))}),this.hiddenPlots={},this.from=0,this.to=this.x.length-1,this.rangeFrom=this.from,this.rangeTo=this.to,this.cacheFull=null,this.cacheFullW=0,this.cacheFullH=0,this.cacheFullFrom=this.from,this.cacheFullTo=this.to}onpointermove(){}ontouchmove(){}onhover(t){}onclick(t){}togglePlot(t,i){this.hiddenPlots[this.names[t]]=!this.hiddenPlots[this.names[t]],i?this.animate():(this.invalidateCache(),this.show())}setFromTo(t,i,h){this.from=Math.max(0,t),this.to=Math.min(this.x.length,i),h?this.animate():(this.invalidateCache(),this.show())}setRange(t,i){this.rangeFrom=t,this.rangeTo=i,this.show(),this.onrangechange()}resize(){const t=Math.floor(this.offsetWidth),i=Math.floor(t*this.aspectRatio);this.cnv.width=Math.floor(t*Plot.pixelRatio),this.cnv.height=Math.floor(i*Plot.pixelRatio),this.cnv.style.width=`${t}px`,this.cnv.style.height=`${i}px`,this.style.height=`${i}px`,this.show()}toggleDarkColors(t){"#FFFFFF"===this.backgroundColor?(this.decorationColor="#546778",this.backgroundColor="#242F3E",this.boxColor="#40566B",this.boxBackgroundColor="RGBA(64,86,107,0.5)",this.textColor="#FFFFFF"):(this.decorationColor="#96A2AA",this.backgroundColor="#FFFFFF",this.boxColor="#DDEAF3",this.boxBackgroundColor="RGBA(221,234,243,0.5)",this.textColor="#000000"),this.invalidateCache(),t||this.show()}render(t,i,h,s){let e=h?0:1/0,o=h?0:-1/0;for(let h=0;h<this.y.length;h++)if(!this.hiddenPlots[this.names[h]])for(let s=t;s<=i;s++){const t=this.y[h][s];e=e>t?t:e,o=o<t?t:o}let n=this.x[t],l=this.x[i];"number"==typeof s&&(t=Math.min(t,this.__cacheFrom__),i=Math.max(i,this.__cacheTo__),e=(e-this.__cacheYMin__)*s+this.__cacheYMin__,o=(o-this.__cacheYMax__)*s+this.__cacheYMax__,n=(n-this.__cacheXMin__)*s+this.__cacheXMin__,l=(l-this.__cacheXMax__)*s+this.__cacheXMax__),this.__cacheXMin__=n,this.__cacheXMax__=l,this.__cacheYMin__=e,this.__cacheYMax__=o,this.__cacheFrom__=t,this.__cacheTo__=i;const c=this.fontHeight*Plot.pixelRatio,a=(this.fontHeight-this.fontSize)/2*Plot.pixelRatio;let r=(o-e)/this.yTicks,x=this.yTicks;const d=(l-n)/this.xTicks,g=(this.cnv.height-2*c)/(o-e),m=this.cnv.width/(l-n);if("number"==typeof this.ySnap&&(r=Math.floor(r/this.ySnap)*this.ySnap),!0===this.ySnap){let t=1;o>1e5?t=1e4:o>1e4?t=1e3:o>1e3?t=100:o>100?t=10:o>10&&(t=5),r=Math.floor(r/t)*t,x=Math.floor(o/r)}if(this.ctx.fillStyle=this.backgroundColor,this.ctx.fillRect(0,0,this.cnv.width,this.cnv.height),h){this.ctx.font=`${this.fontSize*Plot.pixelRatio}px 'Roboto', sans-serif`,this.ctx.fillStyle=this.decorationColor,this.ctx.strokeStyle=this.decorationColor,this.ctx.lineWidth=Plot.pixelRatio,this.ctx.beginPath();for(let t=0;t<=x;t++){const i=this.cnv.height-(c+g*r*t);this.ctx.moveTo(0,i),this.ctx.lineTo(this.cnv.width,i),this.ctx.fillText(`${Math.floor(r*t)}`,0,i-a)}this.ctx.stroke();for(let t=0;t<this.xTicks;t++)this.ctx.fillText(`${Plot.monthDay(Math.floor(d*t+n))}`,m*d*t,this.cnv.height-a)}this.ctx.lineWidth=this.lineWidth*Plot.pixelRatio,this.ctx.lineCap="flat",this.ctx.lineJoin="round";for(let h=0;h<this.y.length;h++)if(!this.hiddenPlots[this.names[h]]){this.ctx.strokeStyle=this.colors[h],this.ctx.beginPath(),this.ctx.moveTo(0,(o-this.y[h][t])*g+c);for(let s=t;s<=i;s++)this.ctx.lineTo((this.x[s]-n)*m,(o-this.y[h][s])*g+c);this.ctx.stroke()}}renderHighlight(t){const i=this.__cacheXMin__,h=this.__cacheXMax__,s=this.__cacheYMin__,e=this.__cacheYMax__,o=this.__cacheFrom__,n=this.__cacheTo__;if(t<o||t>n)throw"Index error";const l=this.fontHeight*Plot.pixelRatio,c=(this.fontHeight,this.fontSize,Plot.pixelRatio,(this.cnv.height-2*l)/(e-s)),a=this.cnv.width/(h-i),r=(this.x[t]-i)*a,x=this.lineWidth*Plot.pixelRatio*2.2;this.ctx.strokeStyle=this.decorationColor,this.ctx.lineWidth=Plot.pixelRatio,this.ctx.beginPath(),this.ctx.moveTo(r,l),this.ctx.lineTo(r,this.cnv.height-l),this.ctx.stroke(),this.ctx.fillStyle=this.backgroundColor,this.ctx.lineWidth=this.lineWidth*Plot.pixelRatio;for(let i=0;i<this.y.length;i++)this.hiddenPlots[this.names[i]]||(this.ctx.strokeStyle=this.colors[i],this.ctx.beginPath(),this.ctx.ellipse(r,(e-this.y[i][t])*c+l,x,x,0,0,2*Math.PI),this.ctx.fill(),this.ctx.stroke());const d=`400 ${this.fontSize*Plot.pixelRatio*1.2}px 'Roboto', sans-serif`,g=`500 ${this.fontSize*Plot.pixelRatio*1.5}px 'Roboto', sans-serif`,m=`400 ${this.fontSize*Plot.pixelRatio}px 'Roboto', sans-serif`,_=.4*this.fontHeight*Plot.pixelRatio,f=`${Plot.weekDay(this.x[t])}, ${Plot.monthDay(this.x[t])}`;this.ctx.font=d;let u=this.ctx.measureText(f),p=_;for(let i=0;i<this.y.length;i++){if(this.hiddenPlots[this.names[i]])continue;this.ctx.font=g;const h=this.ctx.measureText("".concat(this.y[i][t])).width;this.ctx.font=m,p+=Math.max(h,this.ctx.measureText(this.names[i]).width),p+=_}p=Math.max(p,u.width+2*_);let v=r-l;const P=l,w=this.fontHeight*Plot.pixelRatio,F=3.6*w;v+p>this.cnv.width-l?v=this.cnv.width-l-p:v<l&&(v=l);const y=6*Plot.pixelRatio;this.ctx.fillStyle=this.backgroundColor,this.ctx.shadowBlur=6,this.ctx.shadowOffsetY=1*Plot.pixelRatio,this.ctx.shadowColor="rgba(0,0,0,0.2)",this.ctx.beginPath(),this.ctx.moveTo(v+y,P),this.ctx.lineTo(v+p-y,P),this.ctx.quadraticCurveTo(v+p,P,v+p,P+y),this.ctx.lineTo(v+p,P+F-y),this.ctx.quadraticCurveTo(v+p,P+F,v+p-y,P+F),this.ctx.lineTo(v+y,P+F),this.ctx.quadraticCurveTo(v,P+F,v,P+F-y),this.ctx.lineTo(v,P+y),this.ctx.quadraticCurveTo(v,P,v+y,P),this.ctx.fill(),this.ctx.shadowColor="rgba(0,0,0,0)",this.ctx.fillStyle=this.textColor,this.ctx.font=d,this.ctx.fillText(f,v+_,P+w);for(let i=0,h=v;i<this.y.length;i++){if(this.hiddenPlots[this.names[i]])continue;this.ctx.fillStyle=this.colors[i],this.ctx.font=g;const s=`${this.y[i][t]}`,e=this.ctx.measureText(`${this.y[i][t]}`).width;this.ctx.fillText(s,h+_,P+2.6*w),this.ctx.font=m,this.ctx.fillText(this.names[i],h+_,P+3.2*w),h+=_+Math.max(this.ctx.measureText(this.names[i]).width,e)}}renderBox(t,i){const h=this.__cacheXMin__,s=this.__cacheXMax__,e=(this.__cacheYMin__,this.__cacheYMax__,this.__cacheFrom__),o=this.__cacheTo__;if(t<e||i>o)throw"Index error";const n=this.cnv.width/(s-h),l=6*Plot.pixelRatio,c=2*Plot.pixelRatio;this.ctx.fillStyle=this.boxBackgroundColor,this.ctx.beginPath(),this.ctx.rect(0,0,(this.x[t]-h)*n,this.cnv.height),this.ctx.rect((this.x[i]-h)*n,0,this.cnv.width,this.cnv.height),this.ctx.fill(),this.ctx.fillStyle=this.boxColor,this.ctx.beginPath(),this.ctx.rect((this.x[t]-h)*n-l/2,0,l,this.cnv.height),this.ctx.rect((this.x[i]-h)*n-l/2,0,l,this.cnv.height),this.ctx.rect((this.x[t]-h)*n,0,(this.x[i]-this.x[t])*n,c),this.ctx.rect((this.x[t]-h)*n,this.cnv.height-c,(this.x[i]-this.x[t])*n,c),this.ctx.fill()}setCache(){this.cacheFull=this.ctx.getImageData(0,0,this.cnv.width,this.cnv.height),this.cacheFullW=this.cnv.width,this.cacheFullH=this.cnv.height,this.cacheFullFrom=this.from,this.cacheFullTo=this.to}restoreCache(){return!(!this.cacheFull||this.cacheFullW!==this.cnv.width||this.cacheFullH!==this.cnv.height||this.cacheFullFrom!==this.from||this.cacheFullTo!==this.to)&&(this.ctx.putImageData(this.cacheFull,0,0),!0)}invalidateCache(){this.cacheFull=null}static weekDay(t){return["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(+t).getDay()]}static monthDay(t){const i=new Date(+t);return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i.getMonth()]} ${i.getDate()}`}static shareEvent(t,i){return"function"==typeof i?()=>{i(),t()}:t}static get pixelRatio(){if(!Plot.__pixelRatio__){const t=document.createElement("canvas").getContext("2d"),i=window.devicePixelRatio||1,h=t.webkitBackingStorePixelRatio||t.mozBackingStorePixelRatio||t.msBackingStorePixelRatio||t.oBackingStorePixelRatio||t.backingStorePixelRatio||1;Plot.__pixelRatio__=i/h}return Plot.__pixelRatio__}}customElements.define("plot-base",Plot);class PlotHighlight extends Plot{constructor(t){super(t)}show(){this.restoreCache()||(this.render(this.from,this.to,this.axis),this.setCache()),this.hovered&&this.axis&&this.renderHighlight(this.hoverIndex)}animate(t){t=t||.1;let i=0,h=()=>{i<1?(this.render(this.from,this.to,this.axis,i),i+=.1,window.requestAnimationFrame(h)):(this.invalidateCache(),this.show())};window.requestAnimationFrame(h)}onpointermove(t){this.axis&&(this.hoverIndex=(t.clientX-this.cnv.getBoundingClientRect().left)/this.cnv.offsetWidth,this.hoverIndex=Math.floor(this.hoverIndex*(this.to-this.from)+this.from),this.show())}ontouchmove(t){this.hovered=!0,this.onpointermove(t.touches.item(0))}onhover(t){this.axis&&(this.hovered=!!t,this.show())}}customElements.define("plot-highlight",PlotHighlight);class PlotBox extends Plot{constructor(t){super(t),this.axis=!1,this.fontHeight=5,this.aspectRatio=.12,this.lineWidth=1}show(){this.restoreCache()||(this.render(this.from,this.to,this.axis),this.setCache()),this.renderBox(this.rangeFrom,this.rangeTo)}animate(t){t=t||.1;let i=0,h=()=>{i<1?(this.render(this.from,this.to,this.axis,i),this.renderBox(this.rangeFrom,this.rangeTo),i+=.1,window.requestAnimationFrame(h)):(this.invalidateCache(),this.show())};window.requestAnimationFrame(h)}onpointermove(t){if(!this.clicked)return;let i=(t.clientX-this.cnv.getBoundingClientRect().left)/this.cnv.offsetWidth;i=Math.floor(i*(this.to-this.from)+this.from);const h=Math.ceil(this.x.length/20);if(Math.abs(i-this.rangeFrom)<h)this.rangeFrom=Math.max(0,Math.min(i,this.rangeTo-h));else if(Math.abs(i-this.rangeTo)<h)this.rangeTo=Math.min(this.x.length-1,i);else{if(!(i>this.rangeFrom&&i<this.rangeTo))return;{const t=Math.floor((this.rangeTo-this.rangeFrom)/2);this.rangeFrom=Math.max(0,i-t),this.rangeTo=Math.min(this.x.length-1,i+t)}}this.show(),this.onrangechange()}ontouchmove(t){t.preventDefault(),this.clicked=!0,this.onpointermove(t.touches.item(0))}onclick(t){this.clicked=!!t}onhover(t){t||(this.clicked=!1)}}customElements.define("plot-box",PlotBox);class PlotApp extends HTMLElement{constructor(){super(),this.onready=(()=>{}),PlotApp.loadJson(this.dataset.json,t=>{this.heroPlot=new PlotHighlight(t[+this.dataset.chart]),this.scrollPlot=new PlotBox(t[+this.dataset.chart]),this.scrollPlot.onrangechange=(()=>{this.heroPlot.setFromTo(this.scrollPlot.rangeFrom,this.scrollPlot.rangeTo)}),this.scrollPlot.setRange(Math.max(0,this.scrollPlot.x.length-31),Math.min(this.scrollPlot.x.length,this.scrollPlot.x.length-1)),this.appendChild(this.heroPlot),this.appendChild(this.scrollPlot),this.heroPlot.style.marginBottom="15px",this.hiddenCount=0,this.heroPlot.names.forEach((t,i)=>{let h=document.createElement("a"),s=document.createElement("span");s.classList.add("icon"),s.style.borderColor=this.heroPlot.colors[i],h.appendChild(s),h.classList.add("checked"),h.innerHTML=h.innerHTML+t,h.onclick=(()=>{h.classList.contains("checked")&&this.hiddenCount>this.heroPlot.y.length-2||(h.classList.toggle("checked"),this.heroPlot.togglePlot(i,!0),this.scrollPlot.togglePlot(i,!0),this.hiddenCount+=h.classList.contains("checked")?-1:1)}),this.appendChild(h)}),this.onready()})}toggleDarkColors(){this.heroPlot.toggleDarkColors(),this.scrollPlot.toggleDarkColors()}static loadJson(t,i){i(chart_data)}}customElements.define("plot-app",PlotApp);let dark=!1;document.getElementById("dark-colors-button").onclick=(()=>{dark=!dark,[...document.getElementsByTagName("plot-app")].forEach(t=>t.toggleDarkColors()),document.getElementsByTagName("body")[0].classList.toggle("dark"),document.getElementById("dark-colors-button").innerHTML=dark?"Switch to Day Mode":"Switch to Night Mode"});