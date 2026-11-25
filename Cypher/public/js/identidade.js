(() => {
  const form=document.querySelector('[data-register-form]');
  if(form){
    const sincronizarModalidade=(reiniciar=false)=>{
      const consumidor=form.querySelector('[name="tipoConta"]:checked')?.value==='consumidor';
      form.dataset.mode=consumidor?'consumidor':'profissional';
      form.querySelectorAll('[data-professional-only]').forEach(item=>{item.hidden=consumidor || (item.dataset.stepIndicator==='vertentes' && !form.querySelector('[name="categorias"][value="Rapper"]:checked'));});
      form.querySelectorAll('[data-register-stage="vertentes"] input,[data-register-stage="categorias"] input,[data-register-stage="categorias"] select,[data-register-stage="questionarios"] input,[data-register-stage="questionarios"] select').forEach(input=>{input.disabled=consumidor;});
      const proximo=form.querySelector('[data-account-next]');if(proximo)proximo.textContent=consumidor?'Finalizar cadastro':'Continuar →';


      if(reiniciar)form.dispatchEvent(new CustomEvent('cypher:modalidade'));
    };
    form.querySelectorAll('[name="tipoConta"]').forEach(input=>input.addEventListener('change',()=>sincronizarModalidade(true)));
    sincronizarModalidade();
    const senha=form.querySelector('[name="password"]');const confirmacao=form.querySelector('[name="passwordConfirmation"]');
    const conferirSenha=()=>confirmacao.setCustomValidity(confirmacao.value && confirmacao.value!==senha.value?'As senhas não conferem.':'');
    senha?.addEventListener('input',conferirSenha);confirmacao?.addEventListener('input',conferirSenha);
    const handle=form.querySelector('[data-handle-input]');const estado=form.querySelector('[data-handle-state]');let timer;let consulta;
    handle?.addEventListener('input',()=>{clearTimeout(timer);consulta?.abort();estado.textContent='';timer=setTimeout(async()=>{if(!handle.value.trim())return;consulta=new AbortController();const valor=handle.value;try{const resposta=await fetch('/register/identificador',{method:'POST',signal:consulta.signal,headers:{'content-type':'application/json','x-csrf-token':document.querySelector('meta[name="csrf-token"]').content},body:JSON.stringify({identificador:valor})});const resultado=await resposta.json();if(handle.value===valor)estado.textContent=resultado.message;}catch(erro){if(erro.name!=='AbortError')estado.textContent='A disponibilidade será conferida ao continuar.';}},350);});
  }
  document.querySelectorAll('form[data-atuacao-form]').forEach(formulario=>{
    const sincronizarVertentes=()=>{const area=formulario.querySelector('[data-rapper-branches]');if(!area)return;const rapper=[...formulario.querySelectorAll('[name="categorias"]:checked')].some(item=>item.value==='Rapper');const consumidor=formulario.querySelector('[name="tipoConta"]:checked')?.value==='consumidor';area.hidden=!rapper||consumidor;area.querySelectorAll('[name="vertentes"]').forEach(input=>{input.disabled=!rapper||consumidor;});};
    formulario.addEventListener('change',sincronizarVertentes);formulario.addEventListener('cypher:modalidade',sincronizarVertentes);sincronizarVertentes();
  });
})();

(() => {
  const panel = document.querySelector('.tag-page .tag-panel');
  if (!panel || !window.ResizeObserver) return;
  const content = document.createElement('div');
  content.className = 'tag-panel-content';
  content.append(...panel.childNodes);
  panel.append(content);
  const mobile = matchMedia('(max-width: 600px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let animation;
  let initialized = false;
  let previousTarget = 0;
  const resize = () => {
    if (mobile.matches || panel.getClientRects().length === 0) {
      animation?.cancel();
      panel.style.removeProperty('height');
      initialized = false;
      previousTarget = 0;
      return;
    }
    const style = getComputedStyle(panel);
    const target = Math.max(parseFloat(style.minHeight) || 0,
      content.getBoundingClientRect().height + parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
    if (Math.abs(target - previousTarget) < 1) return;
    const from = panel.getBoundingClientRect().height;
    animation?.cancel();
    panel.style.height = `${target}px`;
    if (initialized && !reduced.matches) {
      animation = panel.animate([{height:`${from}px`},{height:`${target}px`}], {
        duration:280, easing:'cubic-bezier(.22,.61,.36,1)'
      });
    }
    previousTarget = target;
    initialized = true;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(content);
  mobile.addEventListener('change', resize);
  reduced.addEventListener('change', resize);
  new MutationObserver(() => {
    if (reduced.matches) return;
    const stage = content.querySelector('[data-register-stage]:not([hidden])');
    if (stage && stage !== lastStage) {
      stage.animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
    }
    lastStage = stage;
  }).observe(content, {subtree:true,attributes:true,attributeFilter:['hidden']});
  let lastStage = content.querySelector('[data-register-stage]:not([hidden])');
  resize();
})();
