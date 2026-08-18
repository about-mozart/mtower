(() => {
  const header=document.querySelector('.header');
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.nav-links');
  const updateHeader=()=>header?.classList.toggle('is-scrolled',window.scrollY>24);
  updateHeader(); window.addEventListener('scroll',updateHeader,{passive:true});
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open);document.body.classList.toggle('menu-open',!open)});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{toggle?.setAttribute('aria-expanded','false');nav.classList.remove('open');document.body.classList.remove('menu-open')}));

  const revealEls=document.querySelectorAll('.reveal,.stagger');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -50px'});
    revealEls.forEach(el=>io.observe(el));
  } else revealEls.forEach(el=>el.classList.add('is-visible'));

  document.querySelectorAll('[data-counter]').forEach(el=>{
    const target=Number(el.dataset.counter||0); const suffix=el.dataset.suffix||'';
    const run=()=>{let start=null;const step=t=>{start??=t;const p=Math.min((t-start)/1200,1);el.textContent=Math.floor(target*(1-Math.pow(1-p,3))).toLocaleString('pt-BR')+suffix;if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)};
    if('IntersectionObserver' in window){const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){run();o.disconnect()}},{threshold:.6});o.observe(el)}else run();
  });

  const process=document.querySelector('[data-process]');
  if(process){const bar=process.querySelector('.process-line-progress');const calc=()=>{const r=process.getBoundingClientRect();const vh=innerHeight;const p=Math.max(0,Math.min(1,(vh*.65-r.top)/(r.height-vh*.2)));bar.style.height=(p*100)+'%'};calc();addEventListener('scroll',calc,{passive:true})}

  document.querySelectorAll('.faq-question').forEach(btn=>btn.addEventListener('click',()=>{const expanded=btn.getAttribute('aria-expanded')==='true';document.querySelectorAll('.faq-question').forEach(b=>b.setAttribute('aria-expanded','false'));btn.setAttribute('aria-expanded',String(!expanded))}));

  const story=document.querySelector('[data-video-story]');
  if(story){
    const video=story.querySelector('video');const sound=story.querySelector('[data-sound]');let soundEnabled=false;
    const explore=on=>{if(matchMedia('(hover:hover)').matches)story.classList.toggle('is-exploring',on);if(soundEnabled){video.volume=on?.28:.06}};
    story.addEventListener('pointerenter',()=>explore(true));story.addEventListener('pointerleave',()=>explore(false));
    sound?.addEventListener('click',async()=>{soundEnabled=!soundEnabled;video.muted=!soundEnabled;video.volume=soundEnabled?.12:0;try{await video.play()}catch(e){}sound.textContent=soundEnabled?'Som ativo · clique para silenciar':'Ativar som';sound.setAttribute('aria-pressed',String(soundEnabled))});
  }

  const filters=document.querySelectorAll('[data-filter]'); const cases=document.querySelectorAll('[data-case]');
  filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;cases.forEach(card=>{card.hidden=!(f==='all'||card.dataset.case===f)})}));

  const form=document.querySelector('[data-contact-form]');
  form?.addEventListener('submit',e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const d=new FormData(form);const body=[
      `Nome: ${d.get('nome')||''}`,`Empresa: ${d.get('empresa')||''}`,`Cargo: ${d.get('cargo')||''}`,`Telefone: ${d.get('telefone')||''}`,`E-mail: ${d.get('email')||''}`,`Segmento: ${d.get('segmento')||''}`,`Estado/País: ${d.get('local')||''}`,`Necessidade: ${d.get('necessidade')||''}`,'',`Descrição:\n${d.get('mensagem')||''}`
    ].join('\n');
    const subject=`Solicitação pelo site — ${d.get('empresa')||d.get('nome')}`;
    location.href=`mailto:comercial@mtower.ind.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const msg=form.querySelector('.form-message');msg.textContent='A mensagem foi preparada no seu aplicativo de e-mail. Confira e clique em enviar.';msg.classList.add('show');
  });


  const ecosystem=document.querySelector('[data-ecosystem]');
  if(ecosystem){
    const map=ecosystem.querySelector('.eco-map');
    const nodes=[...ecosystem.querySelectorAll('.eco-node')];
    const coreLabel=ecosystem.querySelector('[data-eco-core-label]');
    const coreName=ecosystem.querySelector('[data-eco-core-name]');
    const detailIndex=ecosystem.querySelector('[data-eco-detail-index]');
    const detailTitle=ecosystem.querySelector('[data-eco-detail-title]');
    const detailDescription=ecosystem.querySelector('[data-eco-detail-description]');
    const activate=node=>{
      nodes.forEach(item=>{const active=item===node;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});
      map?.classList.add('is-changing');
      if(coreLabel)coreLabel.textContent='MÓDULO ATIVO';
      if(coreName)coreName.textContent=node.dataset.ecoLabel||'MTOWER';
      if(detailIndex)detailIndex.textContent=`${node.dataset.ecoIndex||''} / ${node.dataset.ecoLabel||''}`;
      if(detailTitle)detailTitle.textContent=node.dataset.ecoTitle||'';
      if(detailDescription)detailDescription.textContent=node.dataset.ecoDescription||'';
      setTimeout(()=>map?.classList.remove('is-changing'),220);
    };
    nodes.forEach(node=>{
      node.addEventListener('click',()=>activate(node));
      node.addEventListener('mouseenter',()=>activate(node));
      node.addEventListener('focus',()=>activate(node));
    });
  }
})();

/* Home cinematográfica v3 */
(() => {
  const hero = document.querySelector('[data-hero-story]');
  const heroVideo = hero?.querySelector('[data-hero-video]');
  const heroHover = hero?.querySelector('[data-hero-hover]');
  const heroSound = hero?.querySelector('[data-hero-sound]');
  const heroSoundLabel = heroSound?.querySelector('[data-hero-sound-label]');
  const canHoverHero = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  let heroSoundEnabled = false;
  let heroExploring = false;

  const updateHeroSound = () => {
    if (!heroVideo) return;
    heroVideo.muted = !heroSoundEnabled;
    heroVideo.volume = heroSoundEnabled ? (canHoverHero ? (heroExploring ? 0.24 : 0.055) : 0.16) : 0;
    heroSound?.setAttribute('aria-pressed', String(heroSoundEnabled));
    heroSound?.classList.toggle('is-active', heroSoundEnabled);
    if (heroSoundLabel) heroSoundLabel.textContent = heroSoundEnabled ? 'Som ativo' : 'Ativar som';
  };

  const setHeroExploring = (active) => {
    if (!hero || !canHoverHero) return;
    heroExploring = active;
    hero.classList.toggle('is-exploring', active);
    updateHeroSound();
  };

  heroHover?.addEventListener('pointerenter', () => setHeroExploring(true));
  heroHover?.addEventListener('pointerleave', () => setHeroExploring(false));
  hero?.addEventListener('pointerleave', () => setHeroExploring(false));

  heroSound?.addEventListener('click', async () => {
    if (!heroVideo) return;
    heroSoundEnabled = !heroSoundEnabled;
    updateHeroSound();
    try { await heroVideo.play(); } catch (_) {}
  });

  if (heroVideo && 'IntersectionObserver' in window) {
    updateHeroSound();
    const heroVideoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) heroVideo.play().catch(() => {});
      else {
        heroVideo.pause();
        setHeroExploring(false);
      }
    }, { threshold: 0.05 });
    heroVideoObserver.observe(heroVideo);
  }

  const cinema = document.querySelector('[data-cinema-story]');
  if (cinema) {
    const video = cinema.querySelector('video');
    const chapters = [...cinema.querySelectorAll('[data-cinema-time]')];
    const label = cinema.querySelector('[data-cinema-label]');
    const title = cinema.querySelector('[data-cinema-title]');
    const description = cinema.querySelector('[data-cinema-description]');
    const cleanButton = cinema.querySelector('[data-cinema-clean]');
    const soundButton = cinema.querySelector('[data-cinema-sound]');
    const expandButton = cinema.querySelector('[data-model-expand]');
    const closeButton = cinema.querySelector('[data-model-close]');
    const modelCaption = cinema.querySelector('[data-model-caption]');

    const setExpanded = (expanded) => {
      const modelStage = cinema.querySelector('[data-model-stage]');
      cinema.classList.toggle('is-model-expanded', expanded);
      document.body.classList.toggle('model-viewer-open', expanded);
      expandButton?.setAttribute('aria-expanded', String(expanded));
      closeButton?.setAttribute('aria-hidden', String(!expanded));
      modelStage?.setAttribute('aria-hidden', String(!expanded));
      document.dispatchEvent(new CustomEvent('mtower:model-expanded', {
        detail: { expanded, key: modelStage?.dataset.modelKey || '' }
      }));
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
    };

    const activateChapter = (button) => {
      chapters.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      cinema.classList.add('is-updating');
      if (label) label.textContent = button.dataset.cinemaIndex || '';
      if (title) title.textContent = button.dataset.cinemaTitle || '';
      if (description) description.textContent = button.dataset.cinemaDescription || '';
      if (modelCaption) modelCaption.textContent = button.dataset.modelLabel || button.querySelector('span')?.textContent || 'Equipamento';

      const modelKey = button.dataset.modelKey;
      if (modelKey) {
        const modelStage = cinema.querySelector('[data-model-stage]');
        if (modelStage) modelStage.dataset.modelKey = modelKey;

        /*
          O modelo não é carregado nem exibido nesta seção.
          Ele só é solicitado quando a visualização ampliada é aberta.
        */
        if (cinema.classList.contains('is-model-expanded')) {
          if (window.mtowerModelViewer?.setModel) window.mtowerModelViewer.setModel(modelKey);
          else document.dispatchEvent(new CustomEvent('mtower:model-change', { detail: { key: modelKey } }));
        }
      }

      window.setTimeout(() => cinema.classList.remove('is-updating'), 260);
    };

    chapters.forEach((button) => button.addEventListener('click', () => activateChapter(button)));
    expandButton?.addEventListener('click', () => setExpanded(true));
    closeButton?.addEventListener('click', () => setExpanded(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && cinema.classList.contains('is-model-expanded')) setExpanded(false);
    });

    cleanButton?.addEventListener('click', () => {
      const clean = !cinema.classList.contains('is-clean');
      cinema.classList.toggle('is-clean', clean);
      cleanButton.setAttribute('aria-pressed', String(clean));
      cleanButton.textContent = clean ? 'Mostrar narrativa' : 'Ver vídeo sem texto';
    });

    soundButton?.addEventListener('click', async () => {
      if (!video) return;
      const enabled = video.muted;
      video.muted = !enabled;
      video.volume = enabled ? 0.22 : 0;
      soundButton.setAttribute('aria-pressed', String(enabled));
      soundButton.textContent = enabled ? 'Silenciar' : 'Ativar som';
      try { await video.play(); } catch (_) {}
    });

    if ('IntersectionObserver' in window && video) {
      const videoObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }, { threshold: 0.08 });
      videoObserver.observe(cinema);
    }
  }

  const ecosystem = document.querySelector('[data-ecosystem-v3]');
  if (ecosystem) {
    const modules = [...ecosystem.querySelectorAll('.ecosystem-module')];
    const media = ecosystem.querySelector('.ecosystem-media');
    const image = ecosystem.querySelector('[data-eco-v3-image]');
    const index = ecosystem.querySelector('[data-eco-v3-index]');
    const title = ecosystem.querySelector('[data-eco-v3-title]');
    const description = ecosystem.querySelector('[data-eco-v3-description]');
    let requestId = 0;

    const activate = (button) => {
      modules.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (index) index.textContent = button.dataset.ecoV3Index || '';
      if (title) title.textContent = button.dataset.ecoV3Title || '';
      if (description) description.textContent = button.dataset.ecoV3Description || '';

      const nextSource = button.dataset.ecoV3Image;
      if (!image || !nextSource || image.getAttribute('src') === nextSource) return;
      const currentRequest = ++requestId;
      media?.classList.add('is-changing');
      const preload = new Image();
      preload.onload = () => {
        if (currentRequest !== requestId) return;
        image.src = nextSource;
        image.alt = button.dataset.ecoV3Alt || '';
        window.setTimeout(() => media?.classList.remove('is-changing'), 80);
      };
      preload.onerror = () => media?.classList.remove('is-changing');
      preload.src = nextSource;
    };

    modules.forEach((button) => {
      button.addEventListener('click', () => activate(button));
      button.addEventListener('mouseenter', () => activate(button));
      button.addEventListener('focus', () => activate(button));
    });
  }

  const engineering = document.querySelector('[data-engineering-story]');
  if (engineering) {
    const steps = [...engineering.querySelectorAll('[data-engineering-step]')];
    const wrap = engineering.querySelector('.engineering-image-wrap');
    const image = engineering.querySelector('[data-engineering-image]');
    const phase = engineering.querySelector('[data-engineering-phase]');
    const caption = engineering.querySelector('[data-engineering-caption]');
    let activeStep = steps[0];
    let requestId = 0;

    const activate = (step) => {
      if (!step || step === activeStep) return;
      activeStep = step;
      steps.forEach((item) => item.classList.toggle('active', item === step));
      if (phase) phase.textContent = step.dataset.engineeringPhase || '';
      if (caption) caption.textContent = step.dataset.engineeringCaption || '';
      const nextSource = step.dataset.engineeringImage;
      if (!image || !nextSource || image.getAttribute('src') === nextSource) return;
      const currentRequest = ++requestId;
      wrap?.classList.add('is-changing');
      const preload = new Image();
      preload.onload = () => {
        if (currentRequest !== requestId) return;
        image.src = nextSource;
        image.alt = step.dataset.engineeringAlt || '';
        window.setTimeout(() => wrap?.classList.remove('is-changing'), 90);
      };
      preload.onerror = () => wrap?.classList.remove('is-changing');
      preload.src = nextSource;
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) activate(visible.target);
      }, { rootMargin: '-24% 0px -42% 0px', threshold: [0.12, 0.35, 0.6] });
      steps.forEach((step) => observer.observe(step));
    }
    steps.forEach((step) => step.addEventListener('mouseenter', () => activate(step)));
  }
})();
