/* 텐베거 아카이브 위젯 v1.1 : stockchild.com */
(function(){
  var URL='https://dooly870505-commits.github.io/stockchild-data/data/tenbagger.json';
  var state={data:null,tab:'in5y',shown:{in5y:30,vsPast:30,allTime:30},merged:{}};
  var $=function(id){return document.getElementById(id)};

  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function disp(n){return String(n).replace(/^(주식회사|\(주\)|㈜)\s*/,'').replace(/\s*(주식회사|\(주\)|㈜)$/,'')}
  function won(v){v=Number(v)||0;return v.toLocaleString('ko-KR')+'원'}
  function ym(s){s=String(s);return s.length>=6?s.substring(0,4)+'.'+s.substring(4,6):s}
  function badge(st){return st==='상폐'?'<span class="tb10-badge dead">상장폐지</span>':'<span class="tb10-badge live">상장</span>'}
  function gbClass(g){return g<=-90?'hard':(g<=-50?'mid':'soft')}
  function num(v){var n=Number(v);return isFinite(n)?n:0}

  function clean(raw){
    var out={updated:String(raw&&raw.updated||''),tabs:{in5y:[],vsPast:[],allTime:[]}};
    ['in5y','vsPast','allTime'].forEach(function(t){
      var arr=(raw&&raw.tabs&&raw.tabs[t])||[];
      if(Object.prototype.toString.call(arr)!=='[object Array]')arr=[];
      out.tabs[t]=arr.filter(function(x){return x&&x.c&&x.n}).map(function(x){
        return{c:String(x.c),n:String(x.n),st:String(x.st||''),cur:num(x.cur),gb:num(x.gb),
          m:num(x.m),lm:String(x.lm||''),lp:num(x.lp),hm:String(x.hm||''),hp:num(x.hp),
          m5:num(x.m5),p5:num(x.p5),m10:num(x.m10),p10:num(x.p10)};
      });
    });
    return out;
  }

  function buildIndex(){
    state.merged={};
    ['in5y','vsPast','allTime'].forEach(function(t){
      state.data.tabs[t].forEach(function(x){
        if(!state.merged[x.c])state.merged[x.c]={c:x.c,n:x.n,st:x.st,cur:x.cur,gb:x.gb};
        var m=state.merged[x.c];
        if(t==='in5y')m.r5=x;
        if(t==='allTime')m.rAll=x;
        if(t==='vsPast')m.rPast=x;
      });
    });
  }

  function renderList(){
    var arr=state.data.tabs[state.tab]||[];
    var n=Math.min(state.shown[state.tab],arr.length);
    var html='';
    for(var i=0;i<n;i++){
      var x=arr[i];
      html+='<div class="tb10-card" data-code="'+esc(x.c)+'">';
      html+='<div class="tb10-top"><span><span class="tb10-rank">'+(i+1)+'</span>'
          +'<span class="tb10-name">'+esc(disp(x.n))+'</span>'+badge(x.st)+'</span>';
      if(state.tab==='vsPast'){
        var big=Math.max(x.m5,x.m10);
        html+='<span class="tb10-mult">'+big.toLocaleString()+'배</span></div>';
        var parts=[];
        if(x.m10>0)parts.push('10년 전 '+won(x.p10)+' 대비 '+x.m10+'배');
        if(x.m5>0)parts.push('5년 전 '+won(x.p5)+' 대비 '+x.m5+'배');
        html+='<div class="tb10-sub">'+parts.join(' · ')+' · 현재 '+won(x.cur)+'</div>';
      }else{
        html+='<span class="tb10-mult">'+x.m.toLocaleString()+'배</span></div>';
        html+='<div class="tb10-sub">저점 '+ym(x.lm)+' ('+won(x.lp)+') → 고점 '+ym(x.hm)+' ('+won(x.hp)+')</div>';
      }
      html+='<div class="tb10-gb '+gbClass(x.gb)+'">역대 고점 대비 '+x.gb+'%'
          +(x.st==='상폐'?' · 정리매매 직전가 기준':'')+'</div>';
      html+='</div>';
    }
    if(arr.length>n)html+='<button class="tb10-more" id="tb10more">더 보기 ('+n+' / '+arr.length+')</button>';
    if(arr.length===0)html='<div class="tb10-load">해당 조건의 종목이 없습니다.</div>';
    $('tb10list').innerHTML=html;

    var cards=$('tb10list').querySelectorAll('.tb10-card');
    for(var j=0;j<cards.length;j++){
      cards[j].onclick=function(){showDetail(this.getAttribute('data-code'))};
    }
    var more=$('tb10more');
    if(more)more.onclick=function(){state.shown[state.tab]+=30;renderList()};
  }

  function showDetail(code){
    var m=state.merged[code];if(!m)return;
    var h='<div class="tb10-dname">'+esc(disp(m.n))+badge(m.st)
        +' <span style="font-family:\'JetBrains Mono\',monospace;font-size:13px;color:var(--nct-sub)">'+esc(m.c)+'</span></div>';
    if(m.rAll)h+='<div class="tb10-drow"><span>역대 최대 상승</span><b>'+m.rAll.m.toLocaleString()+'배 ('+ym(m.rAll.lm)+' → '+ym(m.rAll.hm)+')</b></div>';
    if(m.r5)h+='<div class="tb10-drow"><span>5년 내 최대 상승</span><b>'+m.r5.m.toLocaleString()+'배 ('+ym(m.r5.lm)+' → '+ym(m.r5.hm)+')</b></div>';
    if(m.rPast&&m.rPast.m10>0)h+='<div class="tb10-drow"><span>10년 전 대비</span><b>'+m.rPast.m10+'배</b></div>';
    if(m.rPast&&m.rPast.m5>0)h+='<div class="tb10-drow"><span>5년 전 대비</span><b>'+m.rPast.m5+'배</b></div>';
    h+='<div class="tb10-drow"><span>'+(m.st==='상폐'?'정리매매 직전가':'현재가(월봉 종가)')+'</span><b>'+won(m.cur)+'</b></div>';
    h+='<div class="tb10-drow"><span>역대 고점 대비</span><b>'+m.gb+'%</b></div>';
    var d=$('tb10d');d.innerHTML=h;d.style.display='block';
    d.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function bindSearch(){
    var q=$('tb10q'),sug=$('tb10sug');
    q.oninput=function(){
      var v=q.value.trim().toLowerCase();
      if(!v){sug.style.display='none';return}
      var hits=[],k;
      for(k in state.merged){
        var m=state.merged[k];
        if(m.n.toLowerCase().indexOf(v)!==-1||m.c.indexOf(v)!==-1)hits.push(m);
        if(hits.length>=8)break;
      }
      if(!hits.length){sug.style.display='none';return}
      sug.innerHTML=hits.map(function(m){
        return '<div data-code="'+esc(m.c)+'">'+esc(disp(m.n))+' <span style="color:var(--nct-sub);font-size:12px">'+esc(m.c)+'</span></div>';
      }).join('');
      sug.style.display='block';
      var items=sug.querySelectorAll('div[data-code]');
      for(var i=0;i<items.length;i++){
        items[i].onclick=function(){showDetail(this.getAttribute('data-code'));sug.style.display='none';q.value=''};
      }
    };
    document.addEventListener('click',function(e){if(!q.contains(e.target)&&!sug.contains(e.target))sug.style.display='none'});
  }

  function bindTabs(){
    var tabs=document.querySelectorAll('#tb10 .tb10-tab');
    for(var i=0;i<tabs.length;i++){
      tabs[i].onclick=function(){
        for(var j=0;j<tabs.length;j++)tabs[j].classList.remove('on');
        this.classList.add('on');
        state.tab=this.getAttribute('data-tab');
        renderList();
      };
    }
  }

  function init(){
    if(!$('tb10list'))return;
    fetch(URL).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(raw){
      state.data=clean(raw);
      buildIndex();
      if(state.data.updated)$('tb10foot').textContent='출처: 네이버금융 시세(수정주가) · DART · 기준 '+state.data.updated;
      bindSearch();bindTabs();renderList();
    }).catch(function(){
      $('tb10list').innerHTML='<div class="tb10-load">데이터를 불러오지 못했습니다.<br><br><button class="tb10-more" onclick="location.reload()">새로고침</button></div>';
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();
