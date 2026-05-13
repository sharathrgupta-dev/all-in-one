/**
 * Self-contained document for an iframe with `sandbox="allow-scripts"` (no
 * `allow-same-origin`) so the frame has an opaque origin and cannot touch the parent DOM.
 * Communicates only via `postMessage`.
 *
 * The closing `</script>` is split so this module's string does not terminate a host `<script>`.
 */
export function getSandboxJsSrcdoc(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"></head><body><script>
(function(){
var SOURCE='devbench-sandbox';
var currentId=-1;
function post(m){parent.postMessage(Object.assign({source:SOURCE},m),'*');}
function serialize(a){
  try{return JSON.stringify(a);}catch(_){try{return String(a);}catch(__){return'[unprintable]'}}
}
function wrapConsole(){
  var names=['log','info','warn','error','debug'];
  var orig={};
  names.forEach(function(name){
    orig[name]=console[name];
    console[name]=function(){
      orig[name].apply(console,arguments);
      if(currentId<0)return;
      try{
        var args=Array.prototype.slice.call(arguments).map(serialize);
        post({type:'LOG',id:currentId,level:name,args:args});
      }catch(e){post({type:'LOG',id:currentId,level:name,args:['[log error]']});}
    };
  });
  return function restore(){names.forEach(function(n){console[n]=orig[n];});};
}
window.addEventListener('message',function(ev){
  var d=ev.data;
  if(!d||d.type!=='RUN')return;
  currentId=d.id;
  var restore=wrapConsole();
  window.onerror=function(msg,src,line,col,err){
    post({type:'UNCAUGHT',id:currentId,message:String(msg),stack:err&&err.stack?String(err.stack):''});
    return true;
  };
  try{
    var fn=new Function("'use strict';\\n"+String(d.code));
    fn();
    post({type:'DONE',id:currentId});
  }catch(err){
    post({type:'ERROR',id:currentId,message:String(err&&err.message?err.message:err),stack:String(err&&err.stack?err.stack:'')});
  }finally{
    restore();
    window.onerror=null;
    currentId=-1;
  }
});
setTimeout(function(){post({type:'READY'});},0);
})();<` + `/script></body></html>`;
}
