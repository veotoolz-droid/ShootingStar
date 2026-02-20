export const mockResponses: Record<string, string> = {
  "default": `Based on my search, I found several relevant sources that can help answer your question.

## Key Findings

The topic you're asking about involves multiple dimensions including historical context, current developments, and future implications. Here's what the sources indicate:

1. **Primary Sources**: Academic papers and official documentation provide the most authoritative information on this subject.

2. **Recent Developments**: There have been significant advances in this area over the past few years, particularly in methodology and application.

3. **Expert Opinions**: Leading researchers in the field generally agree on the core principles, though there are some debates about specific implementations.

## Summary

The consensus from available sources suggests that this is an evolving field with both established foundations and emerging innovations. For the most accurate and up-to-date information, I recommend consulting the primary sources cited below.`,

  "artificial intelligence": `Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans.

## Overview

AI encompasses a broad range of technologies and approaches, from simple rule-based systems to complex neural networks capable of processing vast amounts of data.

## Key Components

1. **Machine Learning**: Algorithms that allow systems to learn from data and improve from experience without being explicitly programmed.

2. **Deep Learning**: A subset of machine learning based on artificial neural networks with multiple layers.

3. **Natural Language Processing**: Enables machines to understand, interpret, and generate human language.

## Current Applications

- **Healthcare**: Diagnostic assistance, drug discovery, personalized treatment
- **Finance**: Fraud detection, algorithmic trading, risk assessment
- **Transportation**: Autonomous vehicles, route optimization
- **Education**: Personalized learning, automated grading

## Future Outlook

The field continues to evolve rapidly, with ongoing research into areas like artificial general intelligence (AGI), ethical AI, and human-AI collaboration.`,

  "climate change": `Climate change refers to long-term shifts in temperatures and weather patterns, primarily caused by human activities since the Industrial Revolution.

## Scientific Consensus

The overwhelming majority of climate scientists (over 97%) agree that:
- Earth's climate is warming
- Human activities are the primary driver
- The consequences are significant and accelerating

## Key Drivers

1. **Greenhouse Gas Emissions**: CO₂ from burning fossil fuels is the largest contributor
2. **Deforestation**: Reduces the planet's capacity to absorb CO₂
3. **Agriculture**: Methane from livestock and rice cultivation
4. **Industrial Processes**: Various manufacturing emissions

## Observed Effects

- Rising global temperatures (approximately 1.1°C since pre-industrial times)
- Melting ice caps and glaciers
- Sea level rise
- More frequent extreme weather events
- Shifts in ecosystems and wildlife patterns

## Mitigation Strategies

- Transition to renewable energy
- Energy efficiency improvements
- Carbon capture technologies
- Reforestation and ecosystem restoration
- Sustainable agriculture practices`,

  "quantum computing": `Quantum computing represents a paradigm shift in computation, leveraging quantum mechanical phenomena to process information in fundamentally new ways.

## Fundamental Principles

1. **Superposition**: Qubits can exist in multiple states simultaneously, unlike classical bits
2. **Entanglement**: Quantum particles can be correlated in ways that classical physics cannot explain
3. **Quantum Interference**: Manipulating probabilities to enhance correct answers

## Current State

- **Hardware**: Various approaches including superconducting circuits, trapped ions, and photonic systems
- **Error Rates**: Still significant challenges with quantum decoherence and error correction
- **Scale**: Current systems have tens to hundreds of qubits

## Potential Applications

- **Cryptography**: Breaking current encryption and enabling quantum-safe cryptography
- **Drug Discovery**: Simulating molecular interactions at unprecedented scale
- **Optimization**: Solving complex logistics and financial modeling problems
- **Materials Science**: Designing new materials with specific properties

## Timeline

Experts estimate that practical, fault-tolerant quantum computers are still 10-20 years away, though noisy intermediate-scale quantum (NISQ) devices are already showing promise for specific applications.`,

  "space exploration": `Space exploration has entered a new era characterized by increased private sector involvement, international cooperation, and ambitious goals for human expansion beyond Earth.

## Current Missions

1. **Artemis Program**: NASA's initiative to return humans to the Moon by the mid-2020s
2. **Mars Exploration**: Multiple rovers and orbiters studying the Red Planet, with human missions planned for the 2030s
3. **James Webb Space Telescope**: Revolutionizing our understanding of the early universe
4. **Commercial Space Stations**: Private companies developing orbital habitats

## Key Players

- **NASA**: Leading Artemis and deep space exploration
- **SpaceX**: Reusable rockets and Starship development
- **Blue Origin**: Lunar lander and orbital systems
- **ESA, Roscosmos, CNSA**: Major international contributions

## Technological Advances

- Reusable rocket technology dramatically reducing costs
- In-situ resource utilization for sustainable exploration
- Advanced life support systems for long-duration missions
- Nuclear propulsion concepts for faster transit times

## Challenges

- Radiation protection for astronauts
- Psychological effects of long-duration isolation
- Technical complexity of Mars missions
- International coordination and space governance`,

  "renewable energy": `Renewable energy sources are rapidly transforming the global energy landscape, driven by technological advances, cost reductions, and climate imperatives.

## Current Status

Renewables now account for approximately 30% of global electricity generation, with solar and wind leading growth.

## Major Sources

1. **Solar Power**: Costs have dropped 90% in the last decade
2. **Wind Energy**: Both onshore and offshore installations growing rapidly
3. **Hydropower**: Largest source of renewable electricity globally
4. **Geothermal**: Reliable baseload power in suitable locations
5. **Biomass**: Controversial but significant in some regions

## Storage Solutions

- **Lithium-ion batteries**: Dominant technology for grid-scale storage
- **Pumped hydro**: Largest installed storage capacity
- **Emerging technologies**: Flow batteries, compressed air, green hydrogen

## Economic Trends

- Renewables are now the cheapest source of new electricity in most markets
- Investment in clean energy exceeded $1.7 trillion in 2023
- Job creation in renewables outpacing fossil fuel sectors

## Challenges

- Intermittency requiring storage and grid flexibility
- Raw material supply chains for batteries
- Land use and environmental considerations
- Grid infrastructure upgrades needed`,
};

export const mockSources = [
  {
    id: 1,
    title: "Nature - Scientific Research Journal",
    url: "https://www.nature.com",
    domain: "nature.com",
    snippet: "Leading international journal publishing original research across all scientific disciplines.",
  },
  {
    id: 2,
    title: "Science Magazine - AAAS",
    url: "https://www.science.org",
    domain: "science.org",
    snippet: "Peer-reviewed research and news from the American Association for the Advancement of Science.",
  },
  {
    id: 3,
    title: "MIT Technology Review",
    url: "https://www.technologyreview.com",
    domain: "technologyreview.com",
    snippet: "In-depth analysis of emerging technologies and their impact on business and society.",
  },
  {
    id: 4,
    title: "ArXiv.org - Cornell University",
    url: "https://arxiv.org",
    domain: "arxiv.org",
    snippet: "Open-access repository for scientific papers in physics, mathematics, computer science, and more.",
  },
  {
    id: 5,
    title: "NASA Official Website",
    url: "https://www.nasa.gov",
    domain: "nasa.gov",
    snippet: "Official source for space exploration, scientific discovery, and aeronautics research.",
  },
  {
    id: 6,
    title: "World Economic Forum",
    url: "https://www.weforum.org",
    domain: "weforum.org",
    snippet: "International organization for public-private cooperation on global issues.",
  },
];

export function getMockResponse(query: string): { response: string; sources: typeof mockSources } {
  const lowerQuery = query.toLowerCase();
  
  // Find matching topic or use default
  let response = mockResponses.default;
  for (const [key, value] of Object.entries(mockResponses)) {
    if (lowerQuery.includes(key)) {
      response = value;
      break;
    }
  }
  
  // Shuffle and return 3-5 random sources
  const shuffled = [...mockSources].sort(() => Math.random() - 0.5);
  const numSources = Math.floor(Math.random() * 3) + 3; // 3-5 sources
  const sources = shuffled.slice(0, numSources);
  
  return { response, sources };
}
