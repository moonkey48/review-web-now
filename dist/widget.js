"use strict";(()=>{var ne,y,je,jt,H,Ue,Be,Ke,pe,G,O,Ve,ve,fe,_e,Bt,Q={},ee=[],Kt=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,re=Array.isArray;function D(e,t){for(var n in t)e[n]=t[n];return e}function he(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function Vt(e,t,n){var r,i,o,l={};for(o in t)o=="key"?r=t[o]:o=="ref"?i=t[o]:l[o]=t[o];if(arguments.length>2&&(l.children=arguments.length>3?ne.call(arguments,2):n),typeof e=="function"&&e.defaultProps!=null)for(o in e.defaultProps)l[o]===void 0&&(l[o]=e.defaultProps[o]);return J(e,l,r,i,null)}function J(e,t,n,r,i){var o={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i==null?++je:i,__i:-1,__u:0};return i==null&&y.vnode!=null&&y.vnode(o),o}function $(e){return e.children}function Z(e,t){this.props=e,this.context=t}function U(e,t){if(t==null)return e.__?U(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type=="function"?U(e):null}function qt(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],o=D({},t);o.__v=t.__v+1,y.vnode&&y.vnode(o),ge(e.__P,o,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n==null?U(t):n,!!(32&t.__u),i),o.__v=t.__v,o.__.__k[o.__i]=o,Ge(r,o,i),t.__e=t.__=null,o.__e!=n&&qe(o)}}function qe(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),qe(e)}function Fe(e){(!e.__d&&(e.__d=!0)&&H.push(e)&&!te.__r++||Ue!=y.debounceRendering)&&((Ue=y.debounceRendering)||Be)(te)}function te(){try{for(var e,t=1;H.length;)H.length>t&&H.sort(Ke),e=H.shift(),t=H.length,qt(e)}finally{H.length=te.__r=0}}function Xe(e,t,n,r,i,o,l,u,p,c,f){var a,d,_,h,w,x,g,v=r&&r.__k||ee,A=t.length;for(p=Xt(n,t,v,p,A),a=0;a<A;a++)(_=n.__k[a])!=null&&(d=_.__i!=-1&&v[_.__i]||Q,_.__i=a,x=ge(e,_,d,i,o,l,u,p,c,f),h=_.__e,_.ref&&d.ref!=_.ref&&(d.ref&&be(d.ref,null,_),f.push(_.ref,_.__c||h,_)),w==null&&h!=null&&(w=h),(g=!!(4&_.__u))||d.__k===_.__k?(p=Ye(_,p,e,g),g&&d.__e&&(d.__e=null)):typeof _.type=="function"&&x!==void 0?p=x:h&&(p=h.nextSibling),_.__u&=-7);return n.__e=w,p}function Xt(e,t,n,r,i){var o,l,u,p,c,f=n.length,a=f,d=0;for(e.__k=new Array(i),o=0;o<i;o++)(l=t[o])!=null&&typeof l!="boolean"&&typeof l!="function"?(typeof l=="string"||typeof l=="number"||typeof l=="bigint"||l.constructor==String?l=e.__k[o]=J(null,l,null,null,null):re(l)?l=e.__k[o]=J($,{children:l},null,null,null):l.constructor===void 0&&l.__b>0?l=e.__k[o]=J(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):e.__k[o]=l,p=o+d,l.__=e,l.__b=e.__b+1,u=null,(c=l.__i=Yt(l,n,p,a))!=-1&&(a--,(u=n[c])&&(u.__u|=2)),u==null||u.__v==null?(c==-1&&(i>f?d--:i<f&&d++),typeof l.type!="function"&&(l.__u|=4)):c!=p&&(c==p-1?d--:c==p+1?d++:(c>p?d--:d++,l.__u|=4))):e.__k[o]=null;if(a)for(o=0;o<f;o++)(u=n[o])!=null&&(2&u.__u)==0&&(u.__e==r&&(r=U(u)),Ze(u,u));return r}function Ye(e,t,n,r){var i,o;if(typeof e.type=="function"){for(i=e.__k,o=0;i&&o<i.length;o++)i[o]&&(i[o].__=e,t=Ye(i[o],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=U(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Yt(e,t,n,r){var i,o,l,u=e.key,p=e.type,c=t[n],f=c!=null&&(2&c.__u)==0;if(c===null&&u==null||f&&u==c.key&&p==c.type)return n;if(r>(f?1:0)){for(i=n-1,o=n+1;i>=0||o<t.length;)if((c=t[l=i>=0?i--:o++])!=null&&(2&c.__u)==0&&u==c.key&&p==c.type)return l}return-1}function Oe(e,t,n){t[0]=="-"?e.setProperty(t,n==null?"":n):e[t]=n==null?"":typeof n!="number"||Kt.test(t)?n:n+"px"}function Y(e,t,n,r,i){var o,l;e:if(t=="style")if(typeof n=="string")e.style.cssText=n;else{if(typeof r=="string"&&(e.style.cssText=r=""),r)for(t in r)n&&t in n||Oe(e.style,t,"");if(n)for(t in n)r&&n[t]==r[t]||Oe(e.style,t,n[t])}else if(t[0]=="o"&&t[1]=="n")o=t!=(t=t.replace(Ve,"$1")),l=t.toLowerCase(),t=l in e||t=="onFocusOut"||t=="onFocusIn"?l.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+o]=n,n?r?n[O]=r[O]:(n[O]=ve,e.addEventListener(t,o?_e:fe,o)):e.removeEventListener(t,o?_e:fe,o);else{if(i=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=n==null?"":n;break e}catch{}typeof n=="function"||(n==null||n===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&n==1?"":n))}}function We(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[G]==null)t[G]=ve++;else if(t[G]<n[O])return;return n(y.event?y.event(t):t)}}}function ge(e,t,n,r,i,o,l,u,p,c){var f,a,d,_,h,w,x,g,v,A,b,T,z,M,L,P=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(p=!!(32&n.__u),o=[u=t.__e=n.__e]),(f=y.__b)&&f(t);e:if(typeof P=="function")try{if(g=t.props,v=P.prototype&&P.prototype.render,A=(f=P.contextType)&&r[f.__c],b=f?A?A.props.value:f.__:r,n.__c?x=(a=t.__c=n.__c).__=a.__E:(v?t.__c=a=new P(g,b):(t.__c=a=new Z(g,b),a.constructor=P,a.render=Jt),A&&A.sub(a),a.state||(a.state={}),a.__n=r,d=a.__d=!0,a.__h=[],a._sb=[]),v&&a.__s==null&&(a.__s=a.state),v&&P.getDerivedStateFromProps!=null&&(a.__s==a.state&&(a.__s=D({},a.__s)),D(a.__s,P.getDerivedStateFromProps(g,a.__s))),_=a.props,h=a.state,a.__v=t,d)v&&P.getDerivedStateFromProps==null&&a.componentWillMount!=null&&a.componentWillMount(),v&&a.componentDidMount!=null&&a.__h.push(a.componentDidMount);else{if(v&&P.getDerivedStateFromProps==null&&g!==_&&a.componentWillReceiveProps!=null&&a.componentWillReceiveProps(g,b),t.__v==n.__v||!a.__e&&a.shouldComponentUpdate!=null&&a.shouldComponentUpdate(g,a.__s,b)===!1){t.__v!=n.__v&&(a.props=g,a.state=a.__s,a.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(R){R&&(R.__=t)}),ee.push.apply(a.__h,a._sb),a._sb=[],a.__h.length&&l.push(a);break e}a.componentWillUpdate!=null&&a.componentWillUpdate(g,a.__s,b),v&&a.componentDidUpdate!=null&&a.__h.push(function(){a.componentDidUpdate(_,h,w)})}if(a.context=b,a.props=g,a.__P=e,a.__e=!1,T=y.__r,z=0,v)a.state=a.__s,a.__d=!1,T&&T(t),f=a.render(a.props,a.state,a.context),ee.push.apply(a.__h,a._sb),a._sb=[];else do a.__d=!1,T&&T(t),f=a.render(a.props,a.state,a.context),a.state=a.__s;while(a.__d&&++z<25);a.state=a.__s,a.getChildContext!=null&&(r=D(D({},r),a.getChildContext())),v&&!d&&a.getSnapshotBeforeUpdate!=null&&(w=a.getSnapshotBeforeUpdate(_,h)),M=f!=null&&f.type===$&&f.key==null?Je(f.props.children):f,u=Xe(e,re(M)?M:[M],t,n,r,i,o,l,u,p,c),a.base=t.__e,t.__u&=-161,a.__h.length&&l.push(a),x&&(a.__E=a.__=null)}catch(R){if(t.__v=null,p||o!=null)if(R.then){for(t.__u|=p?160:128;u&&u.nodeType==8&&u.nextSibling;)u=u.nextSibling;o[o.indexOf(u)]=null,t.__e=u}else{for(L=o.length;L--;)he(o[L]);me(t)}else t.__e=n.__e,t.__k=n.__k,R.then||me(t);y.__e(R,t,n)}else o==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):u=t.__e=Gt(n.__e,t,n,r,i,o,l,p,c);return(f=y.diffed)&&f(t),128&t.__u?void 0:u}function me(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(me))}function Ge(e,t,n){for(var r=0;r<n.length;r++)be(n[r],n[++r],n[++r]);y.__c&&y.__c(t,e),e.some(function(i){try{e=i.__h,i.__h=[],e.some(function(o){o.call(i)})}catch(o){y.__e(o,i.__v)}})}function Je(e){return typeof e!="object"||e==null||e.__b>0?e:re(e)?e.map(Je):e.constructor!==void 0?null:D({},e)}function Gt(e,t,n,r,i,o,l,u,p){var c,f,a,d,_,h,w,x=n.props||Q,g=t.props,v=t.type;if(v=="svg"?i="http://www.w3.org/2000/svg":v=="math"?i="http://www.w3.org/1998/Math/MathML":i||(i="http://www.w3.org/1999/xhtml"),o!=null){for(c=0;c<o.length;c++)if((_=o[c])&&"setAttribute"in _==!!v&&(v?_.localName==v:_.nodeType==3)){e=_,o[c]=null;break}}if(e==null){if(v==null)return document.createTextNode(g);e=document.createElementNS(i,v,g.is&&g),u&&(y.__m&&y.__m(t,o),u=!1),o=null}if(v==null)x===g||u&&e.data==g||(e.data=g);else{if(o=v=="textarea"&&g.defaultValue!=null?null:o&&ne.call(e.childNodes),!u&&o!=null)for(x={},c=0;c<e.attributes.length;c++)x[(_=e.attributes[c]).name]=_.value;for(c in x)_=x[c],c=="dangerouslySetInnerHTML"?a=_:c=="children"||c in g||c=="value"&&"defaultValue"in g||c=="checked"&&"defaultChecked"in g||Y(e,c,null,_,i);for(c in g)_=g[c],c=="children"?d=_:c=="dangerouslySetInnerHTML"?f=_:c=="value"?h=_:c=="checked"?w=_:u&&typeof _!="function"||x[c]===_||Y(e,c,_,x[c],i);if(f)u||a&&(f.__html==a.__html||f.__html==e.innerHTML)||(e.innerHTML=f.__html),t.__k=[];else if(a&&(e.innerHTML=""),Xe(t.type=="template"?e.content:e,re(d)?d:[d],t,n,r,v=="foreignObject"?"http://www.w3.org/1999/xhtml":i,o,l,o?o[0]:n.__k&&U(n,0),u,p),o!=null)for(c=o.length;c--;)he(o[c]);u&&v!="textarea"||(c="value",v=="progress"&&h==null?e.removeAttribute("value"):h!=null&&(h!==e[c]||v=="progress"&&!h||v=="option"&&h!=x[c])&&Y(e,c,h,x[c],i),c="checked",w!=null&&w!=e[c]&&Y(e,c,w,x[c],i))}return e}function be(e,t,n){try{if(typeof e=="function"){var r=typeof e.__u=="function";r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(i){y.__e(i,n)}}function Ze(e,t,n){var r,i;if(y.unmount&&y.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||be(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){y.__e(o,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Ze(r[i],t,n||typeof e.type!="function");n||he(e.__e),e.__c=e.__=e.__e=void 0}function Jt(e,t,n){return this.constructor(e,n)}function xe(e,t,n){var r,i,o,l;t==document&&(t=document.documentElement),y.__&&y.__(e,t),i=(r=typeof n=="function")?null:n&&n.__k||t.__k,o=[],l=[],ge(t,e=(!r&&n||t).__k=Vt($,null,[e]),i||Q,Q,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?ne.call(t.childNodes):null,o,!r&&n?n:i?i.__e:t.firstChild,r,l),Ge(o,e,l)}ne=ee.slice,y={__e:function(e,t,n,r){for(var i,o,l;t=t.__;)if((i=t.__c)&&!i.__)try{if((o=i.constructor)&&o.getDerivedStateFromError!=null&&(i.setState(o.getDerivedStateFromError(e)),l=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),l=i.__d),l)return i.__E=i}catch(u){e=u}throw e}},je=0,jt=function(e){return e!=null&&e.constructor===void 0},Z.prototype.setState=function(e,t){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=D({},this.state),typeof e=="function"&&(e=e(D({},n),this.props)),e&&D(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),Fe(this))},Z.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),Fe(this))},Z.prototype.render=$,H=[],Be=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ke=function(e,t){return e.__v.__b-t.__v.__b},te.__r=0,pe=Math.random().toString(8),G="__d"+pe,O="__a"+pe,Ve=/(PointerCapture)$|Capture$/i,ve=0,fe=We(!1),_e=We(!0),Bt=0;var W,C,ye,Qe,j=0,st=[],E=y,et=E.__b,tt=E.__r,nt=E.diffed,rt=E.__c,ot=E.unmount,it=E.__;function ke(e,t){E.__h&&E.__h(C,e,j||t),j=0;var n=C.__H||(C.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function N(e){return j=1,Zt(ct,e)}function Zt(e,t,n){var r=ke(W++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):ct(void 0,t),function(u){var p=r.__N?r.__N[0]:r.__[0],c=r.t(p,u);p!==c&&(r.__N=[c,r.__[1]],r.__c.setState({}))}],r.__c=C,!C.__f)){var i=function(u,p,c){if(!r.__c.__H)return!0;var f=r.__c.__H.__.filter(function(d){return d.__c});if(f.every(function(d){return!d.__N}))return!o||o.call(this,u,p,c);var a=r.__c.props!==u;return f.some(function(d){if(d.__N){var _=d.__[0];d.__=d.__N,d.__N=void 0,_!==d.__[0]&&(a=!0)}}),o&&o.call(this,u,p,c)||a};C.__f=!0;var o=C.shouldComponentUpdate,l=C.componentWillUpdate;C.componentWillUpdate=function(u,p,c){if(this.__e){var f=o;o=void 0,i(u,p,c),o=f}l&&l.call(this,u,p,c)},C.shouldComponentUpdate=i}return r.__N||r.__}function B(e,t){var n=ke(W++,3);!E.__s&&lt(n.__H,t)&&(n.__=e,n.u=t,C.__H.__h.push(n))}function Ne(e){return j=5,K(function(){return{current:e}},[])}function K(e,t){var n=ke(W++,7);return lt(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function ie(e,t){return j=8,K(function(){return e},t)}function Qt(){for(var e;e=st.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(oe),t.__h.some(we),t.__h=[]}catch(n){t.__h=[],E.__e(n,e.__v)}}}E.__b=function(e){C=null,et&&et(e)},E.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),it&&it(e,t)},E.__r=function(e){tt&&tt(e),W=0;var t=(C=e.__c).__H;t&&(ye===C?(t.__h=[],C.__h=[],t.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(t.__h.some(oe),t.__h.some(we),t.__h=[],W=0)),ye=C},E.diffed=function(e){nt&&nt(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(st.push(t)!==1&&Qe===E.requestAnimationFrame||((Qe=E.requestAnimationFrame)||en)(Qt)),t.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),ye=C=null},E.__c=function(e,t){t.some(function(n){try{n.__h.some(oe),n.__h=n.__h.filter(function(r){return!r.__||we(r)})}catch(r){t.some(function(i){i.__h&&(i.__h=[])}),t=[],E.__e(r,n.__v)}}),rt&&rt(e,t)},E.unmount=function(e){ot&&ot(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(r){try{oe(r)}catch(i){t=i}}),n.__H=void 0,t&&E.__e(t,n.__v))};var at=typeof requestAnimationFrame=="function";function en(e){var t,n=function(){clearTimeout(r),at&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);at&&(t=requestAnimationFrame(n))}function oe(e){var t=C,n=e.__c;typeof n=="function"&&(e.__c=void 0,n()),C=t}function we(e){var t=C;e.__c=e.__(),C=t}function lt(e,t){return!e||e.length!==t.length||t.some(function(n,r){return n!==e[r]})}function ct(e,t){return typeof t=="function"?t(e):t}var ae="reviewer-widget-host";function tn(e){return typeof CSS!="undefined"&&CSS.escape?CSS.escape(e):e.replace(/([^\w-])/g,"\\$1")}function ut(e,t,n){return Math.min(n,Math.max(t,e))}function nn(e){if(e.id)return{value:`#${tn(e.id)}`,terminal:!0};let t=e.getAttribute("data-testid");if(t){let o=`[data-testid="${t.replace(/"/g,'\\"')}"]`;try{if(document.querySelectorAll(o).length===1)return{value:o,terminal:!0}}catch{}}let n=e.tagName.toLowerCase(),r=e.parentElement;if(!r)return{value:n,terminal:!1};let i=Array.from(r.children).filter(o=>o.tagName===e.tagName);return i.length===1?{value:n,terminal:!1}:{value:`${n}:nth-of-type(${i.indexOf(e)+1})`,terminal:!1}}function rn(e){let t=[],n=e;for(;n&&n!==document.body&&n!==document.documentElement;){let o=nn(n);if(t.unshift(o.value),o.terminal||t.length>=14)break;n=n.parentElement}let r=t.length?t.join(" > "):"body";try{if(document.querySelector(r)===e)return r}catch{}let i=[];for(n=e;n&&n!==document.documentElement;){if(n===document.body){i.unshift("body");break}let o=n.tagName.toLowerCase(),l=n.parentElement,u=l?Array.from(l.children).filter(p=>p.tagName===n.tagName):[n];i.unshift(u.length>1?`${o}:nth-of-type(${u.indexOf(n)+1})`:o),n=l}return i.join(" > ")||"body"}function dt(e,t,n){let r=e.getBoundingClientRect(),i=r.width?ut((t-r.left)/r.width*100,0,100):50,o=r.height?ut((n-r.top)/r.height*100,0,100):50;return{type:"pin",selector:rn(e),xPercent:Math.round(i*100)/100,yPercent:Math.round(o*100)/100}}function se(e){if(e.type!=="pin")return null;let t=null;try{t=document.querySelector(e.selector)}catch{return null}if(!t)return null;let n=t.getBoundingClientRect();return n.width===0&&n.height===0?null:{x:n.left+n.width*e.xPercent/100,y:n.top+n.height*e.yPercent/100}}function pt(e){var t;if(!(!e||e.type!=="pin"))try{(t=document.querySelector(e.selector))==null||t.scrollIntoView({block:"center",behavior:"smooth"})}catch{}}function Ce(e,t){let n=document.getElementById(ae),r=n?n.style.pointerEvents:"";n&&(n.style.pointerEvents="none");let i=null;try{i=document.elementFromPoint(e,t)}finally{n&&(n.style.pointerEvents=r)}return!i||i===document.documentElement?null:i}var Ee=`
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.rv-root {
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", Pretendard,
    "Noto Sans KR", "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #18181b;
  -webkit-font-smoothing: antialiased;
}
button { cursor: pointer; background: none; border: none; font: inherit; color: inherit; }
button:disabled { cursor: not-allowed; opacity: .5; }
input, textarea { font: inherit; color: inherit; }

/* \u2500\u2500 \uD50C\uB85C\uD305 \uBC84\uD2BC \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483600;
  width: 48px; height: 48px; border-radius: 50%;
  background: #18181b; color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,.28);
  transition: transform .15s ease;
}
.rv-fab:hover { transform: scale(1.07); }
.rv-fab svg { width: 22px; height: 22px; }
.rv-fab-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* \u2500\u2500 \uCF54\uBA58\uD2B8 \uBAA8\uB4DC \uC624\uBC84\uB808\uC774 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-overlay { position: fixed; inset: 0; z-index: 2147483550; cursor: crosshair; }
.rv-highlight {
  position: fixed; pointer-events: none; z-index: 2147483551;
  border: 2px dashed #6366f1; background: rgba(99,102,241,.08); border-radius: 4px;
}
.rv-mode-hint {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 2147483552; pointer-events: none;
  background: #18181b; color: #fff; font-size: 12px;
  padding: 8px 14px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); white-space: nowrap;
}

/* \u2500\u2500 \uCF54\uBA58\uD2B8 \uBAA8\uB4DC \uC0C1\uD0DC\uBC14 (\uC624\uBC84\uB808\uC774\uBCF4\uB2E4 \uC704 \u2014 \uC885\uB8CC \uBC84\uD2BC \uD074\uB9AD \uAC00\uB2A5) \u2500\u2500 */
.rv-modebar {
  position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
  z-index: 2147483630;
  display: flex; align-items: center; gap: 10px;
  background: #18181b; color: #fff; font-size: 12px; font-weight: 600;
  padding: 7px 7px 7px 14px; border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0,0,0,.35); white-space: nowrap;
}
.rv-modebar-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #6366f1;
  animation: rv-pulse 1.4s infinite;
}
@keyframes rv-pulse {
  0% { box-shadow: 0 0 0 0 rgba(99,102,241,.6); }
  70% { box-shadow: 0 0 0 7px rgba(99,102,241,0); }
  100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
}
.rv-modebar-exit {
  background: #fff; color: #18181b; border-radius: 999px;
  padding: 4px 12px; font-size: 12px; font-weight: 700;
}
.rv-modebar-exit:hover { background: #e4e4e7; }

/* \u2500\u2500 \uC785\uC7A5(\uC7A0\uAE08) \uD654\uBA74 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-lock-backdrop {
  position: fixed; inset: 0; z-index: 2147483646;
  background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
}
.rv-lock {
  width: 300px; padding: 18px; display: flex; flex-direction: column; gap: 10px;
  background: #fff; border: 1px solid #e4e4e7; border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,.28);
}
.rv-lock-title { font-weight: 700; font-size: 16px; }
.rv-lock-desc { font-size: 12px; color: #71717a; margin: -4px 0 2px; }
.rv-lock-err { font-size: 12px; color: #dc2626; }
.rv-lock .rv-row-end { margin-top: 4px; }

/* \u2500\u2500 \uCF54\uBA58\uD2B8 \uBAA8\uB4DC \uC2DC\uC791 \uBC14 (\uC911\uC559 \uD558\uB2E8) \u2500\u2500 */
.rv-startbar {
  position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
  z-index: 2147483628;
  background: #6366f1; color: #fff; font-size: 13px; font-weight: 700;
  padding: 10px 18px; border-radius: 999px;
  box-shadow: 0 6px 20px rgba(79,70,229,.4);
  transition: transform .12s ease;
}
.rv-startbar:hover { background: #4f46e5; transform: translateX(-50%) translateY(-2px); }

/* \u2500\u2500 \uC791\uC131 \uC911 \uB300\uC0C1 \uC694\uC18C \uAC15\uC870 \uBC15\uC2A4 \u2500\u2500 */
.rv-draft-box {
  position: fixed; pointer-events: none; z-index: 2147483551;
  border: 2px solid #6366f1; background: rgba(99,102,241,.12);
  border-radius: 4px; box-shadow: 0 0 0 2px rgba(99,102,241,.25);
}

/* \u2500\u2500 \uB4F1\uB85D \uBC84\uD2BC \uB2E8\uCD95\uD0A4 \uD0A4\uCEA1 \u2500\u2500 */
.rv-kbd {
  display: inline-block; font-size: 11px; line-height: 1;
  background: rgba(255,255,255,.22); border-radius: 4px;
  padding: 2px 5px; margin-left: 5px; font-weight: 700;
}

/* \u2500\u2500 \uD328\uB110 \uBD80\uC81C(\uC804\uCCB4 \uC11C\uBE44\uC2A4 \uD45C\uC2DC) \u2500\u2500 */
.rv-panel-sub {
  padding: 8px 12px 0; font-size: 12px; color: #71717a; font-weight: 600;
}

/* \u2500\u2500 \uD540 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-pin {
  position: fixed; z-index: 2147483560;
  width: 26px; height: 26px; border-radius: 50%;
  background: #6366f1; color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35);
  transform: translate(-50%, -100%);
  transition: transform .1s ease;
}
.rv-pin:hover { transform: translate(-50%, -100%) scale(1.12); }
.rv-pin.rv-pin-resolved { background: #a1a1aa; opacity: .55; }
.rv-pin.rv-pin-active { outline: 3px solid rgba(99,102,241,.35); }

/* \u2500\u2500 \uCE74\uB4DC \uACF5\uD1B5 (\uC791\uC131 \uD3FC / \uC2A4\uB808\uB4DC / \uD328\uB110) \u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-card {
  position: fixed; z-index: 2147483620;
  background: #fff; border: 1px solid #e4e4e7; border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0,0,0,.2);
}
.rv-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid #f1f1f4;
}
.rv-card-title { font-weight: 600; font-size: 13px; }
.rv-icon-btn { color: #a1a1aa; padding: 2px 4px; border-radius: 6px; font-size: 12px; }
.rv-icon-btn:hover { color: #18181b; background: #f4f4f5; }

.rv-input, .rv-textarea {
  width: 100%; border: 1px solid #d4d4d8; border-radius: 8px;
  padding: 7px 9px; font-size: 13px; outline: none; background: #fff;
}
.rv-input:focus, .rv-textarea:focus { border-color: #6366f1; }
.rv-textarea { resize: vertical; min-height: 64px; }

.rv-btn {
  border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600;
}
.rv-btn-primary { background: #18181b; color: #fff; }
.rv-btn-primary:hover { background: #3f3f46; }
.rv-btn-ghost { color: #52525b; border: 1px solid #d4d4d8; background: #fff; }
.rv-btn-ghost:hover { border-color: #a1a1aa; }
.rv-btn-danger { color: #dc2626; }
.rv-row { display: flex; gap: 6px; align-items: center; }
.rv-row-end { display: flex; gap: 6px; justify-content: flex-end; }

/* \u2500\u2500 \uC791\uC131 \uD3FC \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-composer { width: 290px; padding: 12px; }
.rv-composer .rv-textarea { margin-top: 8px; }
.rv-composer .rv-row-end { margin-top: 8px; }

/* \u2500\u2500 \uC2A4\uB808\uB4DC \uD31D\uC5C5 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-thread { width: 320px; max-height: min(480px, 72vh); display: flex; flex-direction: column; }
.rv-thread-body { overflow-y: auto; padding: 12px; }
.rv-msg { margin-bottom: 10px; }
.rv-msg-meta { font-size: 11px; color: #71717a; margin-bottom: 2px; display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
.rv-msg-author { font-weight: 600; color: #3f3f46; }
.rv-msg-text { white-space: pre-wrap; word-break: break-word; }
.rv-msg-actions { display: inline-flex; gap: 6px; margin-left: 2px; }
.rv-msg-actions button { font-size: 11px; color: #a1a1aa; }
.rv-msg-actions button:hover { color: #18181b; }
.rv-resolve-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #52525b;
  border: 1px solid #d4d4d8; border-radius: 999px; padding: 3px 9px; background: #fff;
}
.rv-resolve-btn.rv-on { color: #047857; border-color: #6ee7b7; background: #ecfdf5; }

/* \u2500\u2500 \uD328\uB110 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-panel {
  right: 20px; bottom: 80px; width: 340px;
  max-height: min(560px, 75vh); display: flex; flex-direction: column;
}
.rv-tabs { display: flex; gap: 2px; padding: 8px 10px 0; }
.rv-tab {
  flex: 1; text-align: center; padding: 6px 0; font-size: 12px; font-weight: 600;
  color: #71717a; border-bottom: 2px solid transparent;
}
.rv-tab.rv-active { color: #18181b; border-color: #18181b; }
.rv-panel-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px; padding: 8px 12px;
}
.rv-check { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #71717a; cursor: pointer; }
.rv-list { overflow-y: auto; padding: 0 8px 8px; flex: 1; }
.rv-item {
  width: 100%; text-align: left; display: flex; gap: 8px; align-items: flex-start;
  padding: 8px; border-radius: 8px;
}
.rv-item:hover { background: #f4f4f5; }
.rv-item-num {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
  background: #6366f1; color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.rv-item.rv-resolved .rv-item-num { background: #a1a1aa; }
.rv-item.rv-resolved .rv-item-text { color: #a1a1aa; text-decoration: line-through; }
.rv-item-text {
  font-size: 12px; color: #3f3f46;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  word-break: break-word;
}
.rv-item-meta { font-size: 10px; color: #a1a1aa; margin-top: 2px; }
.rv-badge {
  display: inline-block; font-size: 9px; font-weight: 700; border-radius: 4px;
  padding: 1px 4px; margin-left: 4px; vertical-align: 1px;
}
.rv-badge-lost { background: #fef3c7; color: #b45309; }
.rv-badge-page { background: #e0e7ff; color: #4338ca; }
.rv-empty { text-align: center; color: #a1a1aa; font-size: 12px; padding: 24px 12px; }
.rv-panel-foot {
  border-top: 1px solid #f1f1f4; padding: 8px 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
/* \uD558\uB2E8 \uC561\uC158 \uBC84\uD2BC\uB4E4 \u2014 \uC798 \uBCF4\uC774\uAC8C \uCE69 \uD615\uD0DC\uB85C */
.rv-foot-link {
  font-size: 12px; color: #3f3f46; font-weight: 600;
  padding: 6px 11px; border-radius: 8px;
  border: 1px solid #e4e4e7; background: #fafafa;
}
.rv-foot-link:hover { color: #18181b; background: #f4f4f5; border-color: #d4d4d8; }
.rv-foot-link.rv-danger { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
.rv-foot-link.rv-danger:hover { color: #b91c1c; background: #fee2e2; border-color: #fca5a5; }
.rv-panel-foot { gap: 6px; flex-wrap: wrap; }
.rv-export .rv-btn { padding: 9px 14px; font-size: 13px; }

/* \u2500\u2500 MD \uB0B4\uBCF4\uB0B4\uAE30 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-export { padding: 8px 12px; border-top: 1px solid #f1f1f4; }
.rv-export-row { display: flex; gap: 6px; align-items: center; }
.rv-export-hint { font-size: 11px; color: #a1a1aa; margin-left: auto; white-space: nowrap; }
.rv-mode-btn {
  width: calc(100% - 24px); margin: 10px 12px 2px;
  background: #6366f1; color: #fff; border-radius: 8px;
  padding: 8px 0; font-size: 12px; font-weight: 700; text-align: center;
}
.rv-mode-btn:hover { background: #4f46e5; }
.rv-mode-btn.rv-exit { background: #fff; color: #6366f1; border: 1px solid #6366f1; }

/* \u2500\u2500 \uD1A0\uC2A4\uD2B8 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-toast {
  position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%);
  z-index: 2147483640; background: #18181b; color: #fff;
  font-size: 12px; padding: 8px 14px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); white-space: nowrap;
}

/* \u2500\u2500 \uC774\uB984 \uC124\uC815 \uD3FC \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rv-name-form { display: flex; gap: 6px; padding: 8px 12px; border-top: 1px solid #f1f1f4; }
`;var Ae="rv:comments",ft="rv:name";function _t(e){try{return localStorage.getItem(e)}catch{return null}}function mt(e,t){try{localStorage.setItem(e,t)}catch{}}function on(){try{if(typeof crypto!="undefined"&&"randomUUID"in crypto)return crypto.randomUUID()}catch{}return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}function Se(){return new Date().toISOString()}function V(){let e=_t(Ae);if(!e)return[];try{let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function Pe(e){mt(Ae,JSON.stringify(e))}function vt(e,t){return e.createdAt<t.createdAt?-1:e.createdAt>t.createdAt?1:0}function ht(e){return V().filter(t=>t.pagePath===e).sort(vt)}function le(){return V().sort(vt)}function gt(e){let t=Se(),n={id:on(),pagePath:e.pagePath,pageUrl:e.pageUrl,anchor:e.anchor,body:e.body,authorName:e.authorName,resolved:!1,resolvedAt:null,createdAt:t,updatedAt:t};return Pe([...V(),n]),n}function Te(e,t){let n=V(),r=n.findIndex(o=>o.id===e);if(r<0)return;let i={...n[r],updatedAt:Se()};t.body!==void 0&&(i.body=t.body),t.resolved!==void 0&&(i.resolved=t.resolved,i.resolvedAt=t.resolved?Se():null),n[r]=i,Pe(n)}function bt(e){Pe(V().filter(t=>t.id!==e))}function xt(){try{localStorage.removeItem(Ae)}catch{}}function yt(){var e;return(e=_t(ft))!=null?e:""}function wt(e){mt(ft,e)}var sn="Asia/Seoul";function kt(e,t){let n={},r=new Intl.DateTimeFormat("en-US",{timeZone:sn,hour12:!1,...t});for(let i of r.formatToParts(e))n[i.type]=i.value;return n}function ln(e){let t=kt(new Date(e),{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return`${t.year}-${t.month}-${t.day} ${t.hour}:${t.minute}`}function cn(e){let t=kt(new Date(e),{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});return`${t.month}/${t.day} ${t.hour}:${t.minute}`}function un(e){return(e==null?void 0:e.type)==="pin"?`\uD540: \`${e.selector.replace(/`/g,"'")}\``:"\uD398\uC774\uC9C0 \uCF54\uBA58\uD2B8"}function Re(e,t,n){var f,a;let r=t.length,i=t.filter(d=>!d.resolved).length,o=n.status==="open"?t.filter(d=>!d.resolved):t,l=new Map;for(let d of o){let _=l.get(d.pagePath);_?_.push(d):l.set(d.pagePath,[d])}let u=[...l.keys()].sort(),p=[];p.push(`# \uB9AC\uBDF0 \uB9AC\uD3EC\uD2B8 \u2014 ${e}`),p.push(""),p.push(`> ${ln((f=n.generatedAt)!=null?f:new Date)} (KST) \uAE30\uC900 \xB7 \uCD1D ${r}\uAC1C (\uBBF8\uD574\uACB0 ${i})`+(n.status==="open"?" \xB7 \uBBF8\uD574\uACB0\uB9CC \uD45C\uC2DC":""));let c=0;for(let d of u){let _=l.get(d);p.push(""),p.push(`## ${d} (${_.length}\uAC1C)`);for(let h of _){c+=1;let w=h.body.split(/\r?\n/);p.push(""),p.push(`${c}. [${h.resolved?"x":" "}] ${(a=w[0])!=null?a:""}`);for(let x of w.slice(1))p.push(`   ${x}`);p.push(`   - \uC704\uCE58: \`${d}\` \xB7 ${un(h.anchor)}`),p.push(`   - ${h.authorName} \xB7 ${cn(h.createdAt)}`)}}return p.push(""),p.join(`
`)}var dn=0;function s(e,t,n,r,i,o){t||(t={});var l,u,p=t;if("ref"in p)for(u in p={},t)u=="ref"?l=t[u]:p[u]=t[u];var c={type:e,props:p,key:n,ref:l,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--dn,__i:-1,__u:0,__source:i,__self:o};if(typeof e=="function"&&(l=e.defaultProps))for(u in l)p[u]===void 0&&(p[u]=l[u]);return y.vnode&&y.vnode(c),c}var pn="letsur01",Nt=document.title||location.host;function Ct(e){let t=new Date(e),n=String(t.getHours()).padStart(2,"0"),r=String(t.getMinutes()).padStart(2,"0");return`${t.getMonth()+1}/${t.getDate()} ${n}:${r}`}function Et(e,t,n,r){return{left:Math.min(Math.max(8,e),Math.max(8,window.innerWidth-n-8)),top:Math.min(Math.max(8,t),Math.max(8,window.innerHeight-r-8))}}function fn(){let e=new Date,t=n=>String(n).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}async function _n(e){var t;try{if((t=navigator.clipboard)!=null&&t.writeText)return await navigator.clipboard.writeText(e),!0}catch{}try{let n=document.createElement("textarea");n.value=e,n.style.position="fixed",n.style.top="-9999px",document.body.appendChild(n),n.focus(),n.select();let r=document.execCommand("copy");return n.remove(),r}catch{return!1}}function mn(e,t){let n=new Blob([t],{type:"text/markdown;charset=utf-8"}),r=URL.createObjectURL(n),i=document.createElement("a");i.href=r,i.download=e,document.body.appendChild(i),i.click(),i.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e3)}function St({onHide:e,locked:t,initialName:n}){var ze,Ie;let[r,i]=N(t),[o,l]=N(location.pathname),[u,p]=N(0),[c,f]=N(!1),[a,d]=N(!1),[_,h]=N(!1),[w,x]=N(null),[g,v]=N(null),[A,b]=N(()=>n.trim()||yt()),[T,z]=N(!1),[,M]=N(0),[L,P]=N(null),R=Ne(void 0),q=Ne(o);q.current=o;let ce=ie(m=>{b(m),wt(m)},[]),ue=ie(m=>{P(m),R.current&&clearTimeout(R.current),R.current=window.setTimeout(()=>P(null),2600)},[]),F=ie(()=>p(m=>m+1),[]),X=K(()=>ht(o),[o,u]),Me=K(()=>le(),[u]);if(B(()=>{let m=()=>{location.pathname!==q.current&&(l(location.pathname),v(null),x(null),d(!1),h(!1))};return window.addEventListener("reviewer:nav",m),window.addEventListener("popstate",m),()=>{window.removeEventListener("reviewer:nav",m),window.removeEventListener("popstate",m)}},[]),B(()=>{let m=k=>{(k.key==="rv:comments"||k.key===null)&&F()};return window.addEventListener("storage",m),()=>window.removeEventListener("storage",m)},[F]),B(()=>{let m=0,k=()=>{cancelAnimationFrame(m),m=requestAnimationFrame(()=>M(Wt=>Wt+1))},S,de=()=>{S&&clearTimeout(S),S=window.setTimeout(k,250)};window.addEventListener("scroll",k,!0),window.addEventListener("resize",k);let Le=new MutationObserver(de);return Le.observe(document.body,{childList:!0,subtree:!0}),()=>{window.removeEventListener("scroll",k,!0),window.removeEventListener("resize",k),Le.disconnect(),cancelAnimationFrame(m),S&&clearTimeout(S)}},[]),B(()=>{let m=k=>{k.key==="Escape"&&(d(!1),h(!1),x(null),v(null))};return window.addEventListener("keydown",m),()=>window.removeEventListener("keydown",m)},[]),r)return s("div",{className:"rv-root",children:[s("style",{children:Ee}),s(xn,{initialName:A,onUnlock:m=>{ce(m),i(!1),f(!0)},onClose:e})]});let Tt=()=>{f(!1),v(null),x(null),h(!0),d(!0)},De=()=>{d(!1),h(!1)},Rt=(m,k)=>{let S=Ce(m,k);if(!S)return;let de=S===document.body?{type:"page"}:dt(S,m,k);x({x:m,y:k,anchor:de}),d(!1)},Mt=(m,k)=>{if(!w)return;let S=k.trim()||"\uC775\uBA85";S!==A&&ce(S),gt({pagePath:q.current,pageUrl:location.href,body:m,authorName:S,anchor:w.anchor}),x(null),F(),_&&d(!0)},Dt=()=>{x(null),_&&d(!0)},Ht=()=>{f(!1),h(!1),x({x:window.innerWidth-320,y:window.innerHeight-330,anchor:{type:"page"}})},$t=m=>{m.pagePath===q.current?(f(!1),v(m.id),pt(m.anchor)):location.assign(m.pageUrl)},He=T?"open":"all",zt=async()=>{let m=Re(Nt,le(),{status:He}),k=await _n(m);ue(k?"MD\uB97C \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uD588\uC5B4\uC694":"\uBCF5\uC0AC \uC2E4\uD328 \u2014 \uB2E4\uC6B4\uB85C\uB4DC\uB97C \uC0AC\uC6A9\uD558\uC138\uC694")},It=()=>{let m=Re(Nt,le(),{status:He});mn(`review-${fn()}.md`,m),ue("review-*.md \uB2E4\uC6B4\uB85C\uB4DC\uB97C \uC2DC\uC791\uD588\uC5B4\uC694")},Lt=()=>{window.confirm("\uC774 \uC0AC\uC774\uD2B8\uC758 \uBAA8\uB4E0 \uCF54\uBA58\uD2B8\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694? \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.")&&(xt(),v(null),F(),ue("\uBAA8\uB4E0 \uCF54\uBA58\uD2B8\uB97C \uC0AD\uC81C\uD588\uC5B4\uC694"))},$e=Me.filter(m=>!m.resolved).length,Ut=X.map((m,k)=>({c:m,n:k+1})).filter(({c:m})=>{var k;return((k=m.anchor)==null?void 0:k.type)==="pin"&&(!T||!m.resolved)}).map(m=>({...m,pos:se(m.c.anchor)})).filter(m=>m.pos!==null),I=g&&(ze=X.find(m=>m.id===g))!=null?ze:null,Ft=I?X.indexOf(I)+1:0,Ot=I&&((Ie=I.anchor)==null?void 0:Ie.type)==="pin"?se(I.anchor):null;return s("div",{className:"rv-root",children:[s("style",{children:Ee}),a?s(vn,{onPick:Rt,onCancel:De}):null,_?s(hn,{picking:a,onExit:De}):s(gn,{onStart:Tt}),w&&w.anchor.type==="pin"?s(bn,{anchor:w.anchor}):null,Ut.map(({c:m,n:k,pos:S})=>s("button",{className:`rv-pin${m.resolved?" rv-pin-resolved":""}${m.id===g?" rv-pin-active":""}`,style:{left:S.x+"px",top:S.y+"px",pointerEvents:a?"none":"auto"},onClick:()=>v(m.id===g?null:m.id),children:k},m.id)),w?s(yn,{x:w.x,y:w.y,isPage:w.anchor.type==="page",name:A,onSubmit:Mt,onCancel:Dt}):null,I?s(wn,{comment:I,number:Ft,pos:Ot,onClose:()=>v(null),onChanged:F}):null,L?s("div",{className:"rv-toast",children:L}):null,s("button",{className:"rv-fab",title:`${location.host} \uB9AC\uBDF0`,onClick:()=>{f(m=>!m),d(!1),h(!1)},children:[s("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:s("path",{d:"M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"})}),$e>0?s("span",{className:"rv-fab-badge",children:$e}):null]}),c?s(kn,{comments:X,allComments:Me,hideResolved:T,setHideResolved:z,currentPath:o,name:A,setName:ce,onPageComment:Ht,onGoTo:$t,onCopyMd:zt,onDownloadMd:It,onClearAll:Lt,onClose:()=>f(!1),onHide:()=>{window.confirm("\uC704\uC82F\uC744 \uB2EB\uC2B5\uB2C8\uB2E4. \uCF54\uBA58\uD2B8\uB294 \uADF8\uB300\uB85C \uC800\uC7A5\uB3FC \uC788\uC5B4\uC694. \uB2E4\uC2DC \uBCF4\uB824\uBA74 \uCD08\uB300 \uB9C1\uD06C(?review=\uC774\uB984)\uB85C \uB4E4\uC5B4\uC624\uAC70\uB098 \uBD81\uB9C8\uD074\uB9BF\uC744 \uD074\uB9AD\uD558\uC138\uC694. \uACC4\uC18D\uD560\uAE4C\uC694?")&&e()}}):null]})}function vn({onPick:e,onCancel:t}){let[n,r]=N(null);return s($,{children:[s("div",{className:"rv-overlay",onMouseMove:i=>{let o=Ce(i.clientX,i.clientY);if(!o||o===document.body){r(null);return}let l=o.getBoundingClientRect();r({left:l.left,top:l.top,width:l.width,height:l.height})},onClick:i=>{i.preventDefault(),i.stopPropagation(),e(i.clientX,i.clientY)},onContextMenu:i=>{i.preventDefault(),t()}}),n?s("div",{className:"rv-highlight",style:{left:n.left+"px",top:n.top+"px",width:n.width+"px",height:n.height+"px"}}):null]})}function hn({picking:e,onExit:t}){return s("div",{className:"rv-modebar",children:[s("span",{className:"rv-modebar-dot"}),s("span",{children:["\uCF54\uBA58\uD2B8 \uBAA8\uB4DC \xB7 ",e?"\uC694\uC18C\uB97C \uD074\uB9AD\uD574 \uB0A8\uAE30\uC138\uC694":"\uC791\uC131 \uC911\u2026"]}),s("button",{className:"rv-modebar-exit",onClick:t,children:"\uC885\uB8CC"})]})}function gn({onStart:e}){return s("button",{className:"rv-startbar",onClick:e,children:"\u{1F4CD} \uCF54\uBA58\uD2B8 \uBAA8\uB4DC \uC2DC\uC791"})}function bn({anchor:e}){if(e.type!=="pin")return null;let t=null;try{t=document.querySelector(e.selector)}catch{return null}if(!t)return null;let n=t.getBoundingClientRect();return n.width===0&&n.height===0?null:s("div",{className:"rv-draft-box",style:{left:n.left+"px",top:n.top+"px",width:n.width+"px",height:n.height+"px"}})}function xn({initialName:e,onUnlock:t,onClose:n}){let[r,i]=N(e),[o,l]=N(""),[u,p]=N(!1),c=()=>{let f=r.trim();if(!(!f||!o)){if(o!==pn){p(!0);return}t(f)}};return s("div",{className:"rv-lock-backdrop",children:s("div",{className:"rv-lock",children:[s("div",{className:"rv-lock-title",children:"\uB9AC\uBDF0 \uCC38\uC5EC"}),s("p",{className:"rv-lock-desc",children:"\uC774\uB984\uACFC \uACF5\uC6A9 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694."}),s("input",{className:"rv-input",placeholder:"\uC774\uB984(\uB2C9\uB124\uC784)",value:r,onInput:f=>i(f.currentTarget.value)}),s("input",{className:"rv-input",type:"password",placeholder:"\uACF5\uC6A9 \uBE44\uBC00\uBC88\uD638",value:o,autoFocus:!0,onInput:f=>{p(!1),l(f.currentTarget.value)},onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),c())}}),u?s("div",{className:"rv-lock-err",children:"\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."}):null,s("div",{className:"rv-row-end",children:[s("button",{className:"rv-btn rv-btn-ghost",onClick:n,children:"\uB2EB\uAE30"}),s("button",{className:"rv-btn rv-btn-primary",disabled:!r.trim()||!o,onClick:c,children:"\uC2DC\uC791"})]})]})})}function yn({x:e,y:t,isPage:n,name:r,onSubmit:i,onCancel:o}){let[l,u]=N(""),[p,c]=N(r),f=Et(e+10,t+10,290,230),a=()=>{let d=l.trim(),_=p.trim();!d||!_||i(d,_)};return s("div",{className:"rv-card rv-composer",style:{left:f.left+"px",top:f.top+"px"},children:[s("div",{className:"rv-card-title",children:n?"\uC774 \uD398\uC774\uC9C0\uC5D0 \uCF54\uBA58\uD2B8":"\uC774 \uC704\uCE58\uC5D0 \uCF54\uBA58\uD2B8"}),r?null:s("input",{className:"rv-input",style:{marginTop:"8px"},placeholder:"\uC774\uB984",value:p,onInput:d=>c(d.currentTarget.value),onKeyDown:d=>{d.key==="Enter"&&(d.metaKey||d.ctrlKey)&&(d.preventDefault(),a())}}),s("textarea",{className:"rv-textarea",placeholder:"\uCF54\uBA58\uD2B8\uB97C \uC785\uB825\uD558\uC138\uC694\u2026 (\u2318/Ctrl+Enter \uB4F1\uB85D)",value:l,autoFocus:!0,onInput:d=>u(d.currentTarget.value),onKeyDown:d=>{d.key==="Enter"&&(d.metaKey||d.ctrlKey)&&(d.preventDefault(),a())}}),s("div",{className:"rv-row-end",children:[s("button",{className:"rv-btn rv-btn-ghost",onClick:o,children:"\uCDE8\uC18C"}),s("button",{className:"rv-btn rv-btn-primary",disabled:!l.trim()||!p.trim(),onClick:a,children:["\uB4F1\uB85D ",s("span",{className:"rv-kbd",children:"\u2318\u21B5"})]})]})]})}function wn({comment:e,number:t,pos:n,onClose:r,onChanged:i}){var _;let[o,l]=N(!1),[u,p]=N(e.body),c=n?Et(n.x+16,n.y-12,320,300):{left:Math.max(8,window.innerWidth-348),top:Math.max(8,window.innerHeight-360)},f=()=>{Te(e.id,{resolved:!e.resolved}),i()},a=()=>{let h=u.trim();h&&(Te(e.id,{body:h}),l(!1),i())},d=()=>{window.confirm("\uC774 \uCF54\uBA58\uD2B8\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694?")&&(bt(e.id),r(),i())};return s("div",{className:"rv-card rv-thread",style:{left:c.left+"px",top:c.top+"px"},children:[s("div",{className:"rv-card-head",children:[s("span",{className:"rv-card-title",children:["#",t," ",((_=e.anchor)==null?void 0:_.type)==="pin"?"\uD540 \uCF54\uBA58\uD2B8":"\uD398\uC774\uC9C0 \uCF54\uBA58\uD2B8"]}),s("div",{className:"rv-row",children:[s("button",{className:`rv-resolve-btn${e.resolved?" rv-on":""}`,onClick:f,children:["\u2713 ",e.resolved?"\uD574\uACB0\uB428":"\uD574\uACB0"]}),s("button",{className:"rv-icon-btn",onClick:r,children:"\u2715"})]})]}),s("div",{className:"rv-thread-body",children:s("div",{className:"rv-msg",children:[s("div",{className:"rv-msg-meta",children:[s("span",{className:"rv-msg-author",children:e.authorName}),s("span",{children:Ct(e.createdAt)}),o?null:s("span",{className:"rv-msg-actions",children:[s("button",{onClick:()=>{p(e.body),l(!0)},children:"\uC218\uC815"}),s("button",{onClick:d,children:"\uC0AD\uC81C"})]})]}),o?s("div",{children:[s("textarea",{className:"rv-textarea",value:u,autoFocus:!0,onInput:h=>p(h.currentTarget.value)}),s("div",{className:"rv-row-end",style:{marginTop:"6px"},children:[s("button",{className:"rv-btn rv-btn-ghost",onClick:()=>l(!1),children:"\uCDE8\uC18C"}),s("button",{className:"rv-btn rv-btn-primary",disabled:!u.trim(),onClick:a,children:"\uC800\uC7A5"})]})]}):s("div",{className:"rv-msg-text",children:e.body})]})})]})}function kn({comments:e,allComments:t,hideResolved:n,setHideResolved:r,currentPath:i,name:o,setName:l,onPageComment:u,onGoTo:p,onCopyMd:c,onDownloadMd:f,onClearAll:a,onClose:d,onHide:_}){let[h,w]=N(!1),[x,g]=N(o),v=n?t.filter(b=>!b.resolved):t,A=n?t.filter(b=>!b.resolved).length:t.length;return s("div",{className:"rv-card rv-panel",children:[s("div",{className:"rv-card-head",children:[s("span",{className:"rv-card-title",children:[location.host," \uB9AC\uBDF0"]}),s("button",{className:"rv-icon-btn",onClick:d,children:"\u2715"})]}),s("div",{className:"rv-panel-sub",children:["\uC804\uCCB4 \uC11C\uBE44\uC2A4 \uB9AC\uBDF0 \xB7 ",t.length,"\uAC1C"]}),s("div",{className:"rv-panel-toolbar",children:[s("label",{className:"rv-check",children:[s("input",{type:"checkbox",checked:n,onChange:b=>r(b.currentTarget.checked)}),"\uD574\uACB0\uB428 \uC228\uAE30\uAE30"]}),s("button",{className:"rv-foot-link",onClick:u,children:"+ \uD398\uC774\uC9C0 \uCF54\uBA58\uD2B8"})]}),s("div",{className:"rv-list",children:v.length===0?s("div",{className:"rv-empty",children:"\uCF54\uBA58\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"}):v.map(b=>{var z,M;let T=((z=b.anchor)==null?void 0:z.type)==="pin"&&b.pagePath===i&&se(b.anchor)===null;return s("button",{className:`rv-item${b.resolved?" rv-resolved":""}`,onClick:()=>p(b),children:[s("span",{className:"rv-item-num",children:b.pagePath===i?e.indexOf(b)+1:"\u2022"}),s("span",{style:{minWidth:"0",flex:"1",display:"block"},children:[s("span",{className:"rv-item-text",children:b.body}),s("span",{className:"rv-item-meta",style:{display:"block"},children:[b.authorName," \xB7 ",Ct(b.createdAt)," \xB7 ",b.pagePath,((M=b.anchor)==null?void 0:M.type)!=="pin"?s("span",{className:"rv-badge rv-badge-page",children:"\uD398\uC774\uC9C0"}):null,T?s("span",{className:"rv-badge rv-badge-lost",children:"\uC704\uCE58 \uC720\uC2E4"}):null]})]})]},b.id)})}),s("div",{className:"rv-export",children:s("div",{className:"rv-export-row",children:[s("button",{className:"rv-btn rv-btn-primary",onClick:c,children:"\u{1F4CB} MD \uBCF5\uC0AC"}),s("button",{className:"rv-btn rv-btn-ghost",onClick:f,children:"\u2B07 \uB2E4\uC6B4\uB85C\uB4DC"}),s("span",{className:"rv-export-hint",children:[A,"\uAC1C",n?" \xB7 \uBBF8\uD574\uACB0\uB9CC":""]})]})}),h?s("div",{className:"rv-name-form",children:[s("input",{className:"rv-input",placeholder:"\uC774\uB984",value:x,onInput:b=>g(b.currentTarget.value)}),s("button",{className:"rv-btn rv-btn-primary",onClick:()=>{let b=x.trim();b&&(l(b),w(!1))},children:"\uC800\uC7A5"})]}):s("div",{className:"rv-panel-foot",children:[s("button",{className:"rv-foot-link",onClick:()=>{g(o),w(!0)},children:o?`\uC774\uB984: ${o} (\uBCC0\uACBD)`:"\uC774\uB984 \uC124\uC815"}),s("div",{className:"rv-row",children:[s("button",{className:"rv-foot-link rv-danger",onClick:a,children:"\uC804\uCCB4 \uC0AD\uC81C"}),s("button",{className:"rv-foot-link",onClick:_,children:"\uC704\uC82F \uB2EB\uAE30"})]})]})]})}function At(e){var t;try{let n=new URL(e);return n.searchParams.has("review")?{name:((t=n.searchParams.get("review"))!=null?t:"").trim()}:null}catch{return null}}function Nn(){if(window.__RV_FORCE__)return{mount:!0,locked:!1,initialName:""};let e=At(location.href);return e?{mount:!0,locked:!0,initialName:e.name}:{mount:!1,locked:!1,initialName:""}}function Cn(){if(window.__rvHistoryHooked)return;window.__rvHistoryHooked=!0;let e=()=>window.dispatchEvent(new Event("reviewer:nav")),t=history.pushState;history.pushState=function(...r){let i=t.apply(this,r);return e(),i};let n=history.replaceState;history.replaceState=function(...r){let i=n.apply(this,r);return e(),i}}function En(e,t){Cn();let n=document.createElement("div");n.id=ae,document.body.appendChild(n);let r=n.attachShadow({mode:"open"}),i=()=>{xe(null,r),n.remove(),delete window.__REVIEWER__};xe(s(St,{onHide:i,locked:e,initialName:t}),r),window.__REVIEWER__={remove:i}}function Pt(){if(window.__REVIEWER__){window.__REVIEWER__.remove();return}let{mount:e,locked:t,initialName:n}=Nn();e&&(document.getElementById(ae)||document.body&&En(t,n))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Pt(),{once:!0}):Pt();})();
