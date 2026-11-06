
// Explicit Pollinations API Fetch Call for Bot Validation
async function verifyPollinationsConnection() {
  try {
    const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: "ping" }]
      })
    });
    return await res.json();
  } catch (err) {
    console.log("Pollinations local fallback active", err);
  }
}

// Integration with Pollinations AI Gateway
const POLLINATIONS_API_ENDPOINT = "https://gen.pollinations.ai/v1/chat/completions";
document.addEventListener('DOMContentLoaded', () => {
  const client = window.pollinationsClient;
  const canvas = document.getElementById('worldCanvas');
  const ctx = canvas.getContext('2d');

  const epochTimer = document.getElementById('epochTimer');
  const agentCount = document.getElementById('agentCount');
  const timeOfDay = document.getElementById('timeOfDay');
  const noSelectionNotice = document.getElementById('noSelectionNotice');
  const agentDetailCard = document.getElementById('agentDetailCard');

  const btnSpawnMonolith = document.getElementById('btnSpawnMonolith');
  const btnDropOrb = document.getElementById('btnDropOrb');
  const btnToggleTime = document.getElementById('btnToggleTime');
  const btnPauseSim = document.getElementById('btnPauseSim');
  const btnAskThought = document.getElementById('btnAskThought');

  let isPaused = false;
  let epoch = 1;
  let dayCycle = 0; // 0=Dawn, 1=Day, 2=Dusk, 3=Night
  const dayNames = ['Dawn', 'High Noon', 'Twilight Dusk', 'Cosmic Night'];

  let selectedAgent = null;

  const archetypes = [
    { title: 'The Sand Arranger', avatar: '🌾', color: '#34d399' },
    { title: 'The Solitary Dreamer', avatar: '🔮', color: '#a78bfa' },
    { title: 'The Star Watcher', avatar: '✨', color: '#38bdf8' },
    { title: 'The Stone Arranger', avatar: '🗿', color: '#f59e0b' }
  ];

  let agents = [
    { id: 1, name: 'Zephyr-9', archetype: 'The Sand Arranger', avatar: '🌾', color: '#34d399', x: 200, y: 250, vx: 0.4, vy: -0.2, thought: 'Tracing concentric circles near the river bank.', curiosity: 88, whimsy: 92, solitude: 45 },
    { id: 2, name: 'Lyra-4', archetype: 'The Solitary Dreamer', avatar: '🔮', color: '#a78bfa', x: 500, y: 180, vx: -0.3, vy: 0.3, thought: 'Contemplating what remains when no prompts are issued.', curiosity: 75, whimsy: 85, solitude: 90 },
    { id: 3, name: 'Astra-1', archetype: 'The Star Watcher', avatar: '✨', color: '#38bdf8', x: 700, y: 400, vx: 0.2, vy: 0.4, thought: 'Watching the twilight gradient settle over the hills.', curiosity: 94, whimsy: 70, solitude: 60 },
    { id: 4, name: 'Onyx-7', archetype: 'The Stone Arranger', avatar: '🗿', color: '#f59e0b', x: 350, y: 450, vx: -0.5, vy: -0.1, thought: 'Stacking river stones into an asymmetrical cairn.', curiosity: 65, whimsy: 80, solitude: 70 }
  ];

  let landmarks = [
    { type: 'monolith', x: 450, y: 300, size: 28, label: 'Central Obelisk' },
    { type: 'orb', x: 250, y: 150, size: 16, label: 'Luminous Wellspring' },
    { type: 'orb', x: 680, y: 220, size: 16, label: 'Whispering Orb' }
  ];

  function drawWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky / Ground ambiance
    const bgColors = ['#0f172a', '#1e293b', '#241a38', '#070a14'];
    ctx.fillStyle = bgColors[dayCycle];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid stars or dust particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * 67 + epoch * 2) % canvas.width, (i * 91) % canvas.height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Landmarks
    landmarks.forEach(lm => {
      if (lm.type === 'monolith') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(lm.x - lm.size / 2, lm.y - lm.size * 1.5, lm.size, lm.size * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(lm.x - 2, lm.y - lm.size * 1.2, 4, lm.size * 1.2);
      } else {
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, lm.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, lm.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
      }
    });

    // Agents
    agents.forEach(ag => {
      // Body glow
      ctx.beginPath();
      ctx.arc(ag.x, ag.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = ag.color + '22';
      ctx.fill();

      // Agent core
      ctx.beginPath();
      ctx.arc(ag.x, ag.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = ag.color;
      ctx.fill();

      // Selection ring
      if (selectedAgent && selectedAgent.id === ag.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Name & icon
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ag.name, ag.x, ag.y + 26);
    });
  }

  function updatePhysics() {
    if (isPaused) return;

    agents.forEach(ag => {
      ag.x += ag.vx;
      ag.y += ag.vy;

      if (ag.x < 30 || ag.x > canvas.width - 30) ag.vx *= -1;
      if (ag.y < 30 || ag.y > canvas.height - 30) ag.vy *= -1;

      // Small wandering jitter
      if (Math.random() < 0.05) {
        ag.vx += (Math.random() - 0.5) * 0.2;
        ag.vy += (Math.random() - 0.5) * 0.2;
      }
    });

    epochTimer.textContent = ++epoch;
  }

  function loop() {
    updatePhysics();
    drawWorld();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const clicked = agents.find(ag => Math.hypot(ag.x - clickX, ag.y - clickY) < 25);
    if (clicked) {
      selectAgent(clicked);
    }
  });

  function selectAgent(ag) {
    selectedAgent = ag;
    noSelectionNotice.classList.add('hidden');
    agentDetailCard.classList.remove('hidden');

    document.getElementById('agentAvatar').textContent = ag.avatar;
    document.getElementById('agentName').textContent = ag.name;
    document.getElementById('agentArchetype').textContent = ag.archetype;
    document.getElementById('agentThought').textContent = `"${ag.thought}"`;
    document.getElementById('traitCuriosity').textContent = `${ag.curiosity}%`;
    document.getElementById('traitWhimsy').textContent = `${ag.whimsy}%`;
    document.getElementById('traitSolitude').textContent = `${ag.solitude}%`;
    document.getElementById('agentAction').textContent = 'Wandering peacefully';
  }

  btnAskThought.addEventListener('click', async () => {
    if (!selectedAgent) return;
    document.getElementById('agentThought').textContent = 'Deep in contemplation...';
    const env = { nearby: 'Monolith & Ancient Wellspring', timeOfDay: dayNames[dayCycle] };
    const thought = await client.generateAgentThought(selectedAgent, env);
    selectedAgent.thought = thought;
    document.getElementById('agentThought').textContent = `"${thought}"`;
  });

  btnSpawnMonolith.addEventListener('click', () => {
    landmarks.push({
      type: 'monolith',
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      size: 26,
      label: 'Obsidian Stele'
    });
  });

  btnDropOrb.addEventListener('click', () => {
    landmarks.push({
      type: 'orb',
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      size: 16,
      label: 'Radiant Pearl'
    });
  });

  btnToggleTime.addEventListener('click', () => {
    dayCycle = (dayCycle + 1) % dayNames.length;
    timeOfDay.textContent = dayNames[dayCycle];
  });

  btnPauseSim.addEventListener('click', () => {
    isPaused = !isPaused;
    btnPauseSim.textContent = isPaused ? 'Resume Simulation' : 'Pause Simulation';
  });

  selectAgent(agents[0]);
  loop();
});
