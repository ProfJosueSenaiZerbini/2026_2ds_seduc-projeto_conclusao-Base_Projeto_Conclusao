(() => {
  const form=document.querySelector('[data-register-form]');
  if(form){
    const sincronizarModalidade=(reiniciar=false)=>{
      const consumidor=form.querySelector('[name="tipoConta"]:checked')?.value==='consumidor';
      form.dataset.mode=consumidor?'consumidor':'profissional';
      form.querySelectorAll('[data-professional-only]').forEach(item=>{item.hidden=consumidor || (item.dataset.stepIndicator==='vertentes' && !form.querySelector('[name="categorias"][value="Rapper"]:checked'));});
      form.querySelectorAll('[data-register-stage="vertentes"] input,[data-register-stage="categorias"] input,[data-register-stage="categorias"] select,[data-register-stage="questionarios"] input,[data-register-stage="questionarios"] select').forEach(input=>{input.disabled=consumidor;});
      const proximo=form.querySelector('[data-account-next]');if(proximo)proximo.textContent=consumidor?'Finalizar cadastro':'Próximo →';


      if(reiniciar)form.dispatchEvent(new CustomEvent('cypher:modalidade'));
    };
    form.querySelectorAll('[name="tipoConta"]').forEach(input=>input.addEventListener('change',()=>sincronizarModalidade(true)));
    sincronizarModalidade();
    const apelido=form.querySelector('[data-has-nickname]');
    const sincronizarVulgo=()=>{const area=form.querySelector('[data-nickname-fields]');if(!area)return;area.hidden=!apelido.checked;area.querySelectorAll('input').forEach(input=>{input.disabled=!apelido.checked;});};
    apelido?.addEventListener('change',sincronizarVulgo);sincronizarVulgo();
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
  const page = document.querySelector(".tag-page");
  if (!page) return;
  const motion = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  function follow(event) {
    page.style.setProperty("--reflexo", (event.clientX / innerWidth * 100) + "%");
    page.style.setProperty("--cursor-x", (event.clientX / innerWidth - .5) * 32 + "px");
    page.style.setProperty("--cursor-y", (event.clientY / innerHeight - .5) * 24 + "px");
  }
  function reset() {
    page.style.removeProperty("--reflexo");
    page.style.removeProperty("--cursor-x");
    page.style.removeProperty("--cursor-y");
  }
  function sync() {
    page.removeEventListener("pointermove", follow);
    reset();
    if (motion.matches) page.addEventListener("pointermove", follow, { passive: true });
  }
  page.addEventListener("pointerleave", reset);
  motion.addEventListener("change", sync);
  sync();
})();
