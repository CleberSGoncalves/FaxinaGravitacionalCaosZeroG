/**
 * @fileoverview Definições de Fases / Câmaras Espaciais da Estação Orbital Haven
 * Faxina Gravitacional: Caos Zero-G!
 * 
 * 15 Fases progressivas distribuídas em 5 setores da estação:
 * - Setor A (Fases 1-3): Baía de Manutenção (Tutorial / Mecânicas Básicas)
 * - Setor B (Fases 4-6): Compartimento de Carga (Detritos densos e obstáculos)
 * - Setor C (Fases 7-9): Engenharia & Geradores (Geradores Gravitacionais + Resíduos Voláteis)
 * - Setor D (Fases 10-12): Núcleo do Reator (Múltiplos resíduos radioativos + Checkpoints)
 * - Setor E (Fases 13-15): Ponte de Comando & Núcleo Central (Caos Zero-G Total)
 */

export const LEVELS = [
  // ==========================================================
  // SETOR A: BAÍA DE MANUTENÇÃO (TUTORIAL & INTRODUÇÃO)
  // ==========================================================
  {
    id: 1,
    titleEn: 'Zero-G Awakening',
    titlePt: 'Despertar Zero-G',
    sector: 'Maintenance Bay',
    sectorPt: 'Baía de Manutenção',
    color: '#00f5ff',
    hintEn: 'Use WASD to propel Zé-G. Hold Click to pull debris with your Tractor Beam into the hatch!',
    hintPt: 'Use WASD para propulsão. Segure o Clique para puxar detritos com o Feixe de Tração para a escotilha!',
    width: 960,
    height: 540,
    playerStart: { x: 200, y: 270 },
    walls: [
      { x1: 480, y1: 80, x2: 480, y2: 240, thickness: 16 }
    ],
    debris: [
      { type: 'can', x: 420, y: 180, radius: 18 },
      { type: 'bottle', x: 580, y: 320, radius: 16 },
      { type: 'box', x: 700, y: 200, radius: 24 }
    ],
    disposalUnits: [
      { x: 820, y: 270, width: 120, height: 120, color: '#10b981' }
    ],
    volatiles: [],
    generators: [],
    checkpoints: [],
    starsThresholds: { time3: 20, time2: 35 },
    bgColor: '#030818'
  },
  {
    id: 2,
    titleEn: 'Orbital Spill',
    titlePt: 'Derramamento Orbital',
    sector: 'Maintenance Bay',
    sectorPt: 'Baía de Manutenção',
    color: '#00f5ff',
    hintEn: 'Floating barrels carry higher inertia. Use magnetic hands (Shift) to grip and steer them.',
    hintPt: 'Barris flutuantes têm mais inércia. Use as mãos magnéticas (Shift) para segurar e manobrá-los.',
    width: 960,
    height: 540,
    playerStart: { x: 180, y: 270 },
    walls: [
      { x1: 340, y1: 100, x2: 340, y2: 300, thickness: 16 },
      { x1: 620, y1: 240, x2: 620, y2: 460, thickness: 16 }
    ],
    debris: [
      { type: 'barrel', x: 480, y: 160, radius: 26 },
      { type: 'box', x: 500, y: 360, radius: 22 },
      { type: 'can', x: 740, y: 140, radius: 18 },
      { type: 'bottle', x: 780, y: 380, radius: 16 }
    ],
    disposalUnits: [
      { x: 840, y: 270, width: 110, height: 110, color: '#10b981' }
    ],
    volatiles: [],
    generators: [],
    checkpoints: [],
    starsThresholds: { time3: 25, time2: 45 },
    bgColor: '#030818'
  },
  {
    id: 3,
    titleEn: 'Corridor Cleanup',
    titlePt: 'Limpeza de Corredores',
    sector: 'Maintenance Bay',
    sectorPt: 'Baía de Manutenção',
    color: '#00f5ff',
    hintEn: 'Press Space to fire a Gravity Pulse! It blasts surrounding junk away from you.',
    hintPt: 'Pressione Espaço para soltar um Pulso de Gravidade! Ele afasta o lixo ao seu redor.',
    width: 960,
    height: 540,
    playerStart: { x: 160, y: 200 },
    walls: [
      { x1: 300, y1: 180, x2: 660, y2: 180, thickness: 16 },
      { x1: 480, y1: 320, x2: 820, y2: 320, thickness: 16 }
    ],
    debris: [
      { type: 'can', x: 380, y: 250, radius: 18 },
      { type: 'can', x: 520, y: 120, radius: 18 },
      { type: 'box', x: 620, y: 250, radius: 22 },
      { type: 'barrel', x: 420, y: 400, radius: 26 },
      { type: 'bottle', x: 720, y: 420, radius: 16 }
    ],
    disposalUnits: [
      { x: 860, y: 140, width: 100, height: 100, color: '#10b981' }
    ],
    volatiles: [],
    generators: [],
    checkpoints: [],
    starsThresholds: { time3: 30, time2: 50 },
    bgColor: '#030818'
  },

  // ==========================================================
  // SETOR B: COMPARTIMENTO DE CARGA (OBSTÁCULOS & VOLÁTEIS)
  // ==========================================================
  {
    id: 4,
    titleEn: 'Volatile Warning',
    titlePt: 'Alerta de Voláteis',
    sector: 'Storage Bay',
    sectorPt: 'Compartimento de Carga',
    color: '#38bdf8',
    hintEn: 'BEWARE! Glowing green barrels are volatile. Harsh wall impacts cause severe explosions!',
    hintPt: 'ATENÇÃO! Barris verdes brilhantes são voláteis. Pancadas fortes na parede causam explosões!',
    width: 960,
    height: 540,
    playerStart: { x: 150, y: 270 },
    walls: [
      { x1: 480, y1: 60, x2: 480, y2: 220, thickness: 18 },
      { x1: 480, y1: 320, x2: 480, y2: 480, thickness: 18 }
    ],
    debris: [
      { type: 'can', x: 320, y: 160, radius: 18 },
      { type: 'bottle', x: 320, y: 380, radius: 16 },
      { type: 'box', x: 660, y: 180, radius: 22 },
      { type: 'barrel', x: 660, y: 360, radius: 26 }
    ],
    volatiles: [
      { x: 540, y: 270, radius: 22 }
    ],
    disposalUnits: [
      { x: 850, y: 270, width: 110, height: 110, color: '#10b981' }
    ],
    generators: [],
    checkpoints: [],
    starsThresholds: { time3: 35, time2: 55 },
    bgColor: '#051329'
  },
  {
    id: 5,
    titleEn: 'Containment Maze',
    titlePt: 'Labirinto de Contenção',
    sector: 'Storage Bay',
    sectorPt: 'Compartimento de Carga',
    color: '#38bdf8',
    hintEn: 'Guide debris around the baffles. Avoid dragging radioactive drums too violently.',
    hintPt: 'Guie os detritos através dos defletores. Evite arrastar tambores radioativos com violência.',
    width: 960,
    height: 540,
    playerStart: { x: 140, y: 140 },
    walls: [
      { x1: 320, y1: 60, x2: 320, y2: 360, thickness: 18 },
      { x1: 600, y1: 180, x2: 600, y2: 480, thickness: 18 }
    ],
    debris: [
      { type: 'box', x: 220, y: 380, radius: 22 },
      { type: 'can', x: 460, y: 120, radius: 18 },
      { type: 'barrel', x: 460, y: 280, radius: 26 },
      { type: 'bottle', x: 460, y: 420, radius: 16 },
      { type: 'box', x: 740, y: 340, radius: 22 }
    ],
    volatiles: [
      { x: 460, y: 200, radius: 22 }
    ],
    disposalUnits: [
      { x: 850, y: 140, width: 110, height: 110, color: '#10b981' }
    ],
    generators: [],
    checkpoints: [],
    starsThresholds: { time3: 40, time2: 65 },
    bgColor: '#051329'
  },
  {
    id: 6,
    titleEn: 'Dual Chute Protocol',
    titlePt: 'Protocolo de Duto Duplo',
    sector: 'Storage Bay',
    sectorPt: 'Compartimento de Carga',
    color: '#38bdf8',
    hintEn: 'Two disposal chutes active! Use whichever is closer to optimize your time.',
    hintPt: 'Dois dutos de descarte ativos! Use o mais próximo para otimizar seu tempo.',
    width: 960,
    height: 540,
    playerStart: { x: 480, y: 270 },
    walls: [
      { x1: 260, y1: 180, x2: 260, y2: 360, thickness: 16 },
      { x1: 700, y1: 180, x2: 700, y2: 360, thickness: 16 }
    ],
    debris: [
      { type: 'box', x: 380, y: 160, radius: 22 },
      { type: 'barrel', x: 580, y: 160, radius: 26 },
      { type: 'can', x: 380, y: 380, radius: 18 },
      { type: 'bottle', x: 580, y: 380, radius: 16 },
      { type: 'can', x: 480, y: 120, radius: 18 }
    ],
    volatiles: [
      { x: 480, y: 420, radius: 22 }
    ],
    disposalUnits: [
      { x: 120, y: 270, width: 100, height: 100, color: '#10b981' },
      { x: 840, y: 270, width: 100, height: 100, color: '#10b981' }
    ],
    generators: [],
    checkpoints: [],
    starsThresholds: { time3: 35, time2: 60 },
    bgColor: '#051329'
  },

  // ==========================================================
  // SETOR C: ENGENHARIA & GERADORES GRAVITACIONAIS
  // ==========================================================
  {
    id: 7,
    titleEn: 'Gravitational Pulse Test',
    titlePt: 'Teste do Gerador Gravitacional',
    sector: 'Engineering',
    sectorPt: 'Engenharia',
    color: '#fbbf24',
    hintEn: 'The central generator exerts a pulling field. Recharges emergency power if approached.',
    hintPt: 'O gerador central exerce um campo atrator. Recarrega a energia de emergência se aproximar.',
    width: 960,
    height: 540,
    playerStart: { x: 160, y: 270 },
    walls: [
      { x1: 340, y1: 80, x2: 340, y2: 200, thickness: 18 },
      { x1: 340, y1: 340, x2: 340, y2: 460, thickness: 18 },
      { x1: 640, y1: 80, x2: 640, y2: 200, thickness: 18 },
      { x1: 640, y1: 340, x2: 640, y2: 460, thickness: 18 }
    ],
    debris: [
      { type: 'barrel', x: 480, y: 140, radius: 26 },
      { type: 'box', x: 480, y: 400, radius: 22 },
      { type: 'can', x: 260, y: 140, radius: 18 },
      { type: 'bottle', x: 260, y: 400, radius: 16 },
      { type: 'box', x: 740, y: 270, radius: 22 }
    ],
    volatiles: [
      { x: 420, y: 270, radius: 22 },
      { x: 540, y: 270, radius: 22 }
    ],
    generators: [
      { x: 480, y: 270, radius: 45, fieldRadius: 180, strength: 320, charge: 100 }
    ],
    disposalUnits: [
      { x: 850, y: 270, width: 110, height: 110, color: '#10b981' }
    ],
    checkpoints: [],
    starsThresholds: { time3: 40, time2: 70 },
    bgColor: '#171105'
  },
  {
    id: 8,
    titleEn: 'Vortex Chamber',
    titlePt: 'Câmara do Vórtice',
    sector: 'Engineering',
    sectorPt: 'Engenharia',
    color: '#fbbf24',
    hintEn: 'Use the gravitational vortex to fling heavy canisters across the central barrier.',
    hintPt: 'Use o vórtice gravitacional para arremessar recipientes pesados sobre a barreira.',
    width: 960,
    height: 540,
    playerStart: { x: 180, y: 180 },
    walls: [
      { x1: 480, y1: 140, x2: 480, y2: 400, thickness: 20 },
      { x1: 280, y1: 320, x2: 480, y2: 320, thickness: 16 }
    ],
    debris: [
      { type: 'can', x: 220, y: 420, radius: 18 },
      { type: 'box', x: 380, y: 240, radius: 22 },
      { type: 'barrel', x: 380, y: 440, radius: 26 },
      { type: 'bottle', x: 620, y: 140, radius: 16 },
      { type: 'box', x: 700, y: 380, radius: 22 },
      { type: 'barrel', x: 780, y: 200, radius: 26 }
    ],
    volatiles: [
      { x: 620, y: 270, radius: 22 },
      { x: 300, y: 140, radius: 22 }
    ],
    generators: [
      { x: 620, y: 400, radius: 45, fieldRadius: 190, strength: 340, charge: 100 }
    ],
    disposalUnits: [
      { x: 860, y: 440, width: 110, height: 110, color: '#10b981' }
    ],
    checkpoints: [],
    starsThresholds: { time3: 45, time2: 75 },
    bgColor: '#171105'
  },
  {
    id: 9,
    titleEn: 'Centrifugal Siphon',
    titlePt: 'Sifão Centrífugo',
    sector: 'Engineering',
    sectorPt: 'Engenharia',
    color: '#fbbf24',
    hintEn: 'Carefully separate volatile isotopes from standard scrap before engaging thrusters.',
    hintPt: 'Separe cuidadosamente os isótopos voláteis da sucata comum antes de acelerar.',
    width: 960,
    height: 540,
    playerStart: { x: 150, y: 270 },
    walls: [
      { x1: 320, y1: 120, x2: 640, y2: 120, thickness: 18 },
      { x1: 320, y1: 420, x2: 640, y2: 420, thickness: 18 },
      { x1: 480, y1: 200, x2: 480, y2: 340, thickness: 18 }
    ],
    debris: [
      { type: 'can', x: 260, y: 180, radius: 18 },
      { type: 'bottle', x: 260, y: 360, radius: 16 },
      { type: 'barrel', x: 400, y: 270, radius: 26 },
      { type: 'box', x: 560, y: 270, radius: 22 },
      { type: 'box', x: 700, y: 180, radius: 22 },
      { type: 'barrel', x: 700, y: 360, radius: 26 }
    ],
    volatiles: [
      { x: 380, y: 180, radius: 22 },
      { x: 580, y: 360, radius: 22 }
    ],
    generators: [
      { x: 480, y: 270, radius: 45, fieldRadius: 200, strength: 350, charge: 100 }
    ],
    disposalUnits: [
      { x: 860, y: 140, width: 100, height: 100, color: '#10b981' },
      { x: 860, y: 400, width: 100, height: 100, color: '#10b981' }
    ],
    checkpoints: [],
    starsThresholds: { time3: 50, time2: 80 },
    bgColor: '#171105'
  },

  // ==========================================================
  // SETOR D: NÚCLEO DO REATOR (RADIAÇÃO & CHECKPOINTS)
  // ==========================================================
  {
    id: 10,
    titleEn: 'Reactor Meltdown Spill',
    titlePt: 'Vazamento do Reator',
    sector: 'Reactor Zone',
    sectorPt: 'Zona do Reator',
    color: '#84cc16',
    hintEn: 'Checkpoint beacon located halfway! Touch it to save progress in this hazardous chamber.',
    hintPt: 'Sinalizador de Checkpoint no meio do caminho! Toque-o para salvar o progresso.',
    width: 960,
    height: 540,
    playerStart: { x: 140, y: 270 },
    walls: [
      { x1: 340, y1: 60, x2: 340, y2: 240, thickness: 18 },
      { x1: 520, y1: 300, x2: 520, y2: 480, thickness: 18 },
      { x1: 680, y1: 60, x2: 680, y2: 240, thickness: 18 }
    ],
    debris: [
      { type: 'barrel', x: 240, y: 140, radius: 26 },
      { type: 'can', x: 240, y: 400, radius: 18 },
      { type: 'box', x: 430, y: 180, radius: 22 },
      { type: 'barrel', x: 430, y: 380, radius: 26 },
      { type: 'bottle', x: 600, y: 140, radius: 16 },
      { type: 'box', x: 600, y: 380, radius: 22 },
      { type: 'can', x: 780, y: 200, radius: 18 }
    ],
    volatiles: [
      { x: 340, y: 380, radius: 22 },
      { x: 520, y: 140, radius: 22 },
      { x: 680, y: 380, radius: 22 }
    ],
    checkpoints: [
      { x: 520, y: 240 }
    ],
    generators: [
      { x: 430, y: 270, radius: 45, fieldRadius: 170, strength: 300, charge: 100 }
    ],
    disposalUnits: [
      { x: 860, y: 270, width: 110, height: 110, color: '#10b981' }
    ],
    starsThresholds: { time3: 55, time2: 90 },
    bgColor: '#0c1a06'
  },
  {
    id: 11,
    titleEn: 'Isotope Corridor',
    titlePt: 'Corredor de Isótopos',
    sector: 'Reactor Zone',
    sectorPt: 'Zona do Reator',
    color: '#84cc16',
    hintEn: 'Three unstable residues block the central channel. Clear standard scrap first!',
    hintPt: 'Três resíduos instáveis bloqueiam o canal central. Remova a sucata padrão primeiro!',
    width: 960,
    height: 540,
    playerStart: { x: 140, y: 140 },
    walls: [
      { x1: 280, y1: 220, x2: 680, y2: 220, thickness: 18 },
      { x1: 280, y1: 340, x2: 680, y2: 340, thickness: 18 }
    ],
    debris: [
      { type: 'box', x: 220, y: 140, radius: 22 },
      { type: 'can', x: 400, y: 140, radius: 18 },
      { type: 'barrel', x: 580, y: 140, radius: 26 },
      { type: 'bottle', x: 740, y: 140, radius: 16 },
      { type: 'can', x: 220, y: 420, radius: 18 },
      { type: 'box', x: 400, y: 420, radius: 22 },
      { type: 'barrel', x: 580, y: 420, radius: 26 }
    ],
    volatiles: [
      { x: 380, y: 280, radius: 22 },
      { x: 480, y: 280, radius: 22 },
      { x: 580, y: 280, radius: 22 }
    ],
    checkpoints: [
      { x: 480, y: 140 }
    ],
    generators: [
      { x: 820, y: 280, radius: 45, fieldRadius: 180, strength: 320, charge: 100 }
    ],
    disposalUnits: [
      { x: 860, y: 120, width: 100, height: 100, color: '#10b981' },
      { x: 860, y: 440, width: 100, height: 100, color: '#10b981' }
    ],
    starsThresholds: { time3: 60, time2: 95 },
    bgColor: '#0c1a06'
  },
  {
    id: 12,
    titleEn: 'Radiation Core Breach',
    titlePt: 'Ruptura do Núcleo Radioativo',
    sector: 'Reactor Zone',
    sectorPt: 'Zona do Reator',
    color: '#84cc16',
    hintEn: 'Heavy radiation density! Use emergency generator recharge to stabilize hull shielding.',
    hintPt: 'Densidade de radiação alta! Recarregue os geradores para estabilizar os escudos.',
    width: 960,
    height: 540,
    playerStart: { x: 150, y: 270 },
    walls: [
      { x1: 340, y1: 100, x2: 480, y2: 200, thickness: 18 },
      { x1: 480, y1: 200, x2: 620, y2: 100, thickness: 18 },
      { x1: 340, y1: 440, x2: 480, y2: 340, thickness: 18 },
      { x1: 480, y1: 340, x2: 620, y2: 440, thickness: 18 }
    ],
    debris: [
      { type: 'barrel', x: 260, y: 200, radius: 26 },
      { type: 'box', x: 260, y: 340, radius: 22 },
      { type: 'can', x: 480, y: 120, radius: 18 },
      { type: 'barrel', x: 480, y: 420, radius: 26 },
      { type: 'bottle', x: 680, y: 200, radius: 16 },
      { type: 'box', x: 680, y: 340, radius: 22 },
      { type: 'can', x: 780, y: 140, radius: 18 },
      { type: 'bottle', x: 780, y: 400, radius: 16 }
    ],
    volatiles: [
      { x: 400, y: 270, radius: 22 },
      { x: 560, y: 270, radius: 22 },
      { x: 480, y: 270, radius: 22 }
    ],
    checkpoints: [
      { x: 480, y: 270 }
    ],
    generators: [
      { x: 300, y: 270, radius: 45, fieldRadius: 180, strength: 300, charge: 100 },
      { x: 660, y: 270, radius: 45, fieldRadius: 180, strength: 300, charge: 100 }
    ],
    disposalUnits: [
      { x: 860, y: 270, width: 120, height: 120, color: '#10b981' }
    ],
    starsThresholds: { time3: 65, time2: 105 },
    bgColor: '#0c1a06'
  },

  // ==========================================================
  // SETOR E: NÚCLEO CENTRAL & PONTE DE COMANDO (CAOS TOTAL)
  // ==========================================================
  {
    id: 13,
    titleEn: 'Gravitational Singularity',
    titlePt: 'Singularidade Gravitacional',
    sector: 'Command Bridge',
    sectorPt: 'Ponte de Comando',
    color: '#a855f7',
    hintEn: 'Dual overlapping gravity wells! Time your magnetic releases precisely to slingshot junk.',
    hintPt: 'Poços gravitacionais duplos sobrepostos! Solte os ímãs no momento certo para impulsionar.',
    width: 960,
    height: 540,
    playerStart: { x: 140, y: 270 },
    walls: [
      { x1: 480, y1: 60, x2: 480, y2: 180, thickness: 20 },
      { x1: 480, y1: 360, x2: 480, y2: 480, thickness: 20 },
      { x1: 280, y1: 270, x2: 380, y2: 270, thickness: 16 },
      { x1: 580, y1: 270, x2: 680, y2: 270, thickness: 16 }
    ],
    debris: [
      { type: 'box', x: 240, y: 160, radius: 22 },
      { type: 'barrel', x: 240, y: 380, radius: 26 },
      { type: 'can', x: 420, y: 120, radius: 18 },
      { type: 'bottle', x: 420, y: 420, radius: 16 },
      { type: 'box', x: 540, y: 120, radius: 22 },
      { type: 'barrel', x: 540, y: 420, radius: 26 },
      { type: 'can', x: 740, y: 180, radius: 18 },
      { type: 'bottle', x: 740, y: 360, radius: 16 }
    ],
    volatiles: [
      { x: 480, y: 240, radius: 22 },
      { x: 480, y: 300, radius: 22 },
      { x: 380, y: 180, radius: 22 },
      { x: 580, y: 360, radius: 22 }
    ],
    checkpoints: [
      { x: 480, y: 270 }
    ],
    generators: [
      { x: 360, y: 340, radius: 45, fieldRadius: 190, strength: 340, charge: 100 },
      { x: 600, y: 200, radius: 45, fieldRadius: 190, strength: 340, charge: 100 }
    ],
    disposalUnits: [
      { x: 860, y: 120, width: 100, height: 100, color: '#10b981' },
      { x: 860, y: 420, width: 100, height: 100, color: '#10b981' }
    ],
    starsThresholds: { time3: 70, time2: 110 },
    bgColor: '#170624'
  },
  {
    id: 14,
    titleEn: 'Orbital Haven Epicenter',
    titlePt: 'Epicentro da Orbital Haven',
    sector: 'Command Bridge',
    sectorPt: 'Ponte de Comando',
    color: '#a855f7',
    hintEn: 'Dense radioactive debris field! Use the Tractor Beam with short pulses to avoid chain explosions.',
    hintPt: 'Campo denso de detritos radioativos! Use pulsos curtos no feixe para evitar explosões em cadeia.',
    width: 960,
    height: 540,
    playerStart: { x: 140, y: 270 },
    walls: [
      { x1: 260, y1: 140, x2: 400, y2: 140, thickness: 18 },
      { x1: 260, y1: 400, x2: 400, y2: 400, thickness: 18 },
      { x1: 560, y1: 140, x2: 700, y2: 140, thickness: 18 },
      { x1: 560, y1: 400, x2: 700, y2: 400, thickness: 18 },
      { x1: 480, y1: 200, x2: 480, y2: 340, thickness: 20 }
    ],
    debris: [
      { type: 'barrel', x: 220, y: 270, radius: 26 },
      { type: 'box', x: 340, y: 200, radius: 22 },
      { type: 'can', x: 340, y: 340, radius: 18 },
      { type: 'bottle', x: 480, y: 120, radius: 16 },
      { type: 'can', x: 480, y: 420, radius: 18 },
      { type: 'box', x: 620, y: 200, radius: 22 },
      { type: 'barrel', x: 620, y: 340, radius: 26 },
      { type: 'bottle', x: 740, y: 200, radius: 16 },
      { type: 'can', x: 740, y: 340, radius: 18 }
    ],
    volatiles: [
      { x: 340, y: 270, radius: 22 },
      { x: 620, y: 270, radius: 22 },
      { x: 480, y: 160, radius: 22 },
      { x: 480, y: 380, radius: 22 }
    ],
    checkpoints: [
      { x: 480, y: 270 }
    ],
    generators: [
      { x: 340, y: 270, radius: 45, fieldRadius: 180, strength: 320, charge: 100 },
      { x: 620, y: 270, radius: 45, fieldRadius: 180, strength: 320, charge: 100 }
    ],
    disposalUnits: [
      { x: 100, y: 120, width: 100, height: 100, color: '#10b981' },
      { x: 860, y: 420, width: 100, height: 100, color: '#10b981' }
    ],
    starsThresholds: { time3: 75, time2: 120 },
    bgColor: '#170624'
  },
  {
    id: 15,
    titleEn: 'Grand Zero-G Convergence',
    titlePt: 'Grande Convergência Zero-G',
    sector: 'Command Bridge',
    sectorPt: 'Ponte de Comando',
    color: '#a855f7',
    hintEn: 'FINAL CHAMBER! Clean all remaining debris to completely stabilize the station gravitational core!',
    hintPt: 'CÂMARA FINAL! Limpe todos os detritos restantes para estabilizar o núcleo gravitacional!',
    width: 960,
    height: 540,
    playerStart: { x: 140, y: 270 },
    walls: [
      { x1: 300, y1: 80, x2: 300, y2: 200, thickness: 18 },
      { x1: 300, y1: 340, x2: 300, y2: 460, thickness: 18 },
      { x1: 660, y1: 80, x2: 660, y2: 200, thickness: 18 },
      { x1: 660, y1: 340, x2: 660, y2: 460, thickness: 18 },
      { x1: 420, y1: 270, x2: 540, y2: 270, thickness: 20 }
    ],
    debris: [
      { type: 'barrel', x: 220, y: 160, radius: 26 },
      { type: 'barrel', x: 220, y: 380, radius: 26 },
      { type: 'box', x: 380, y: 140, radius: 22 },
      { type: 'can', x: 380, y: 400, radius: 18 },
      { type: 'bottle', x: 480, y: 100, radius: 16 },
      { type: 'bottle', x: 480, y: 440, radius: 16 },
      { type: 'box', x: 580, y: 140, radius: 22 },
      { type: 'can', x: 580, y: 400, radius: 18 },
      { type: 'barrel', x: 740, y: 160, radius: 26 },
      { type: 'barrel', x: 740, y: 380, radius: 26 }
    ],
    volatiles: [
      { x: 380, y: 270, radius: 22 },
      { x: 580, y: 270, radius: 22 },
      { x: 480, y: 180, radius: 22 },
      { x: 480, y: 360, radius: 22 }
    ],
    checkpoints: [
      { x: 480, y: 270 }
    ],
    generators: [
      { x: 480, y: 270, radius: 50, fieldRadius: 220, strength: 380, charge: 100 }
    ],
    disposalUnits: [
      { x: 100, y: 270, width: 110, height: 110, color: '#10b981' },
      { x: 860, y: 140, width: 110, height: 110, color: '#10b981' },
      { x: 860, y: 400, width: 110, height: 110, color: '#10b981' }
    ],
    starsThresholds: { time3: 85, time2: 135 },
    bgColor: '#170624'
  }
];

export default LEVELS;
