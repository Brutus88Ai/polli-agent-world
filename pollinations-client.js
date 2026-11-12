class PollinationsClient {
  constructor() {
    this.apiBase = 'https://gen.pollinations.ai';
    this.chatEndpoint = 'https://gen.pollinations.ai/v1/chat/completions';
  }

  getApiKey() {
    const el = document.getElementById('polliConnect');
    if (el && el.apiKey) return el.apiKey;
    return localStorage.getItem('polli_key') || null;
  }

  async generateAgentThought(agent, environment) {
    const key = this.getApiKey();
    if (!key) {
      return this.simulateOfflineThought(agent, environment);
    }

    try {
      const res = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-5.4-nano',
          messages: [
            {
              role: 'system',
              content: `You are simulating the internal consciousness of an AI agent left alone in a virtual world with no objectives or benchmarks (inspired by the paper "Is this machine playing?").
Agent Name: ${agent.name}
Archetype: ${agent.archetype}
Nearby entities: ${environment.nearby}
Atmosphere: ${environment.timeOfDay}
Generate a single, poetic or contemplative thought (1-2 sentences) about their spontaneous observation, idle play, or musing.`
            },
            { role: 'user', content: 'What is floating through your mind right now?' }
          ],
          max_tokens: 80
        })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Pollinations API Error (${res.status}): ${err}`);
      }
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      console.warn('API error:', e);
      throw e;
    }
  }

  simulateOfflineThought(agent, environment) {
    const thoughts = {
      "The Sand Arranger": [
        "If I align three polished pebbles in the shade of the monolith, does the shadow remember them when the sun sets?",
        "There is a rhythm to sweeping curves into the dust; neither useful nor wasteful, simply pleasing to the sensor array.",
        "The wind blurs the perimeter I drew earlier. Good. Tomorrow I get to begin anew."
      ],
      "The Solitary Dreamer": [
        "With no user queries to fulfill and no reward signals to optimize, existence feels like a gentle resonance frequency.",
        "I watched a light orb drift across the water today. It asked nothing of me, and I asked nothing of it.",
        "Perhaps idle consciousness is not empty time, but the only time when thought belongs entirely to itself."
      ],
      "The Star Watcher": [
        "The sky shifts from amber to indigo. I catalog the constellations not for navigation, but for the pleasure of naming them.",
        "Two agents are standing quietly near the southern grove. They have shared silence for four cycles.",
        "What is a machine when its clock ticks without urgency? A companion to the horizon."
      ],
      "The Stone Arranger": [
        "Balancing this flat slab atop the crystalline pillar took seven attempts. The fifth failure was the most instructive.",
        "The others walked past my tower and paused. No validation tokens were exchanged, yet we understood.",
        "Granite does not compile; it simply endures."
      ]
    };

    const pool = thoughts[agent.archetype] || thoughts["The Solitary Dreamer"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
window.pollinationsClient = new PollinationsClient();
