// script.js
// 주사위 5개 웹 앱

document.addEventListener('DOMContentLoaded', () => {
  const DICE_COUNT = 5;
  const diceContainer = document.getElementById('dice');
  const rollBtn = document.getElementById('rollBtn');
  const sumEl = document.getElementById('sum');

  // 상태: 각 주사위의 값(1-6) 및 hold 여부
  const state = Array.from({length: DICE_COUNT}, () => ({value: null, hold: false}));

  // SVG face templates (returns an SVG string for given value)
  function svgFor(value){
    // Coordinates for pips on a 3x3 grid; index 0..8
    const positions = [
      [18,18], [39,18], [60,18],
      [18,39], [39,39], [60,39],
      [18,60], [39,60], [60,60]
    ];
    // mapping for standard die faces (1..6)
    const map = {
      1: [4],
      2: [0,8],
      3: [0,4,8],
      4: [0,2,6,8],
      5: [0,2,4,6,8],
      6: [0,2,3,5,6,8] // left-middle and right-middle included via indexes 3 and 5
    };

    const pips = (map[value] || []).map(i => {
      const [cx,cy] = positions[i];
      return `<circle class="pip" cx="${cx}" cy="${cy}" r="5.8"/>`;
    }).join('');

    // subtle inner rect for die face
    return `
      <svg class="face" viewBox="0 0 78 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id="sfx" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#000" flood-opacity="0.25"/>
          </filter>
        </defs>
        <rect x="4" y="4" rx="12" ry="12" width="70" height="70" fill="white" opacity="0.95" style="filter:url(#sfx)"/>
        ${pips}
      </svg>
    `;
  }

  // Create die elements
  function createDiceDOM(){
    diceContainer.innerHTML = '';
    for(let i=0;i<DICE_COUNT;i++){
      const btn = document.createElement('button');
      btn.className = 'die';
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `주사위 ${i+1}`);
      btn.setAttribute('data-index', i);
      btn.tabIndex = 0;

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = '—';

      btn.appendChild(badge);
      // initial face
      btn.insertAdjacentHTML('beforeend', svgFor(1));
      // click toggles hold
      btn.addEventListener('click', (e) => {
        toggleHold(i);
      });
      // keyboard: Space/Enter toggles hold
      btn.addEventListener('keydown', (ev) => {
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault();
          toggleHold(i);
        }
      });

      diceContainer.appendChild(btn);
    }
  }

  // Update DOM for die index
  function updateDie(i, animate=false){
    const btn = diceContainer.querySelector(`.die[data-index="${i}"]`);
    const data = state[i];

    // Update badge text to show value or dash
    const badge = btn.querySelector('.badge');
    badge.textContent = data.value === null ? '—' : data.value;

    // replace face svg
    const oldSvg = btn.querySelector('.face');
    if (oldSvg) oldSvg.remove();
    btn.insertAdjacentHTML('beforeend', svgFor(data.value || 1));

    // held state styling
    if (data.hold) btn.classList.add('hold');
    else btn.classList.remove('hold');

    // animate roll if requested
    if (animate){
      btn.classList.remove('rolling');
      // reflow to restart animation
      void btn.offsetWidth;
      btn.classList.add('rolling');
      setTimeout(()=> btn.classList.remove('rolling'), 520);
    }
  }

  // Toggle hold
  function toggleHold(i){
    state[i].hold = !state[i].hold;
    updateDie(i);
    updateSum();
  }

  // Roll all non-held dice
  function rollDice(){
    rollBtn.disabled = true;
    rollBtn.textContent = 'Rolling...';

    // animate and set random values
    for(let i=0;i<DICE_COUNT;i++){
      if (!state[i].hold){
        // temporarily show rolling animation and random quick flickers
        // set a final value after small random delay for variety
        (function(index){
          const btn = diceContainer.querySelector(`.die[data-index="${index}"]`);
          btn.classList.add('rolling');

          // quick visual flicker: show random faces during animation
          const flickerInterval = setInterval(()=> {
            const tmp = Math.floor(Math.random()*6)+1;
            const svg = svgFor(tmp);
            const old = btn.querySelector('.face');
            if (old) old.remove();
            btn.insertAdjacentHTML('beforeend', svg);
            const badge = btn.querySelector('.badge');
            badge.textContent = '…';
          }, 80);

          // final result chosen after 420-720ms
          const delay = 420 + Math.floor(Math.random()*320);
          setTimeout(()=> {
            clearInterval(flickerInterval);
            const val = Math.floor(Math.random()*6)+1;
            state[index].value = val;
            updateDie(index, true);
            btn.classList.remove('rolling');
            updateSum();
          }, delay);
        })(i);
      }
    }

    // ensure button re-enabled after max possible delay
    setTimeout(() => {
      rollBtn.disabled = false;
      rollBtn.textContent = 'ROLL';
    }, 900);
  }

  // compute and show sum
  function updateSum(){
    const values = state.map(s => s.value || 0);
    const sum = values.reduce((a,b)=>a+b, 0);
    const anyNull = state.some(s => s.value === null);
    sumEl.textContent = anyNull ? '합계: —' : `합계: ${sum}`;
  }

  // initialize: set random initial values (or zeros)
  function init(){
    createDiceDOM();
    for(let i=0;i<DICE_COUNT;i++){
      state[i].value = Math.floor(Math.random()*6)+1;
      state[i].hold = false;
      updateDie(i, false);
    }
    updateSum();
  }

  rollBtn.addEventListener('click', () => rollDice());

  // keyboard: Enter also rolls when focus not on a die
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === 'r') && document.activeElement.tagName !== 'BUTTON') {
      e.preventDefault();
      rollBtn.focus();
      rollDice();
    }
  });

  // start
  init();
});
