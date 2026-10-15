/**
 * @fileoverview Internationalization (i18n) localization module for Faxina Gravitacional: Caos Zero-G!
 * Features full English (EN) and Brazilian Portuguese (PT-BR) localizations,
 * automatic browser language detection, reactive events, and storage persistence.
 */

import { storage } from './storage.js';

export const DICTIONARY = {
  en: {
    // Brand & Intro
    brand_text: 'FLUIDCLEB INTERACTIVE',
    game_title: 'Gravitational Cleanup: Zero-G Chaos!',
    game_subtitle: 'Space Station Physics Puzzle',
    skip_intro: 'Skip Story ➔',
    continue_btn: 'Continue ➔',
    continue: 'Continue ➔',
    play: 'Play Now',

    // Lore Acts
    lore_act1_title: 'The Gravitational Meltdown',
    lore_act1_desc: 'Aboard space station Orbital Haven, the gravitational core has failed, plunging everything into zero-g chaos!',
    lore_act2_title: 'Zé-G the Janitor',
    lore_act2_desc: 'The clumsy janitor Zé-G must clean radioactive waste while floating uncontrollably through the corridors.',
    lore_act3_title: 'Clean or Catastrophe',
    lore_act3_desc: 'Guide Zé-G with your gravity device! Dispose of debris, avoid volatile residues, and save Orbital Haven!',

    // HUD & Ingame
    level: 'Chamber',
    sector: 'Sector',
    attempts: 'Attempts',
    score: 'Score',
    stars: 'Stars',
    timer: 'Time',
    health: 'Health',
    gravity_charge: 'Gravity Charge',
    gravity_ready: 'READY! Activate Gravity Pulse!',
    tractor_beam: 'Tractor Beam',
    magnetic_hands: 'Magnetic Hands',
    paused: 'Game Paused',
    resume: 'Resume',
    restart: 'Restart',
    menu: 'Levels',
    trash: 'Debris',
    trash_disposed_hud: 'Cleaned',

    // Modals
    level_cleared: 'Chamber Cleaned!',
    level_failed: 'Station Breach!',
    level_failed_desc: 'Zé-G took too much damage! Use an Emergency Kit to revive right here.',
    congrats: 'Outstanding Cleanup!',
    stars_collected: 'Stars Earned',
    time_taken: 'Time',
    trash_disposed: 'Trash Disposed',
    double_rewards: 'Double Stars & Coins (2x)',
    revive_btn: 'Revive 1x (Emergency Kit)',
    next_level: 'Next Chamber ➔',
    try_again: 'Try Again 🔄',
    level_select: 'Select Chamber',
    locked: 'Locked',
    all_levels_beaten: 'You cleaned the entire Orbital Haven! You are a Legendary Janitor!',
    checkpoint_saved: 'Checkpoint Saved!',
    checkpoint_ad_btn: 'Save Checkpoint (Ad)',

    // Settings
    settings: 'Settings',
    settings_audio: 'Audio & Music',
    settings_master_vol: 'Master Volume',
    settings_bgm_vol: 'Music (BGM)',
    settings_sfx_vol: 'Sound FX',
    settings_mute_all: 'Mute All Audio',
    settings_unmute_all: 'Unmute Audio',
    settings_video: 'Graphics & Visuals',
    settings_quality: 'Visual Quality',
    settings_quality_high: 'High Definition',
    settings_quality_low: 'Performance',
    settings_trajectory: 'Show Tractor Beam Range',
    settings_shake: 'Screen Shake Effects',
    settings_lang: 'Language',
    settings_reset: 'Reset All Progress',
    settings_reset_confirm: 'Are you sure you want to reset all stars and progress?',
    settings_close: 'Save & Close',

    // Controls
    controls_title: 'Controls',
    controls_wasd: 'WASD / Arrows — Thruster Movement',
    controls_mouse: 'Mouse Click & Hold — Tractor Beam',
    controls_space: 'Space — Gravity Pulse',
    controls_shift: 'Shift — Magnetic Grab/Release',
    controls_touch: 'Touch: Left side = Move, Right side = Actions'
  },

  'pt-BR': {
    // Brand & Intro
    brand_text: 'FLUIDCLEB INTERACTIVE',
    game_title: 'Faxina Gravitacional: Caos Zero-G!',
    game_subtitle: 'Quebra-cabeça de Física Espacial',
    skip_intro: 'Pular História ➔',
    continue_btn: 'Continuar ➔',
    continue: 'Continuar ➔',
    play: 'Jogar Agora',

    // Lore Acts
    lore_act1_title: 'O Colapso Gravitacional',
    lore_act1_desc: 'A bordo da estação espacial Orbital Haven, o núcleo gravitacional falhou, lançando tudo em um pandemônio de zero-g!',
    lore_act2_title: 'Zé-G o Zelador Espacial',
    lore_act2_desc: 'O zelador desajeitado Zé-G deve recolher lixo radioativo enquanto flutua sem rumo pelos corredores da estação.',
    lore_act3_title: 'Faxina ou Catástrofe',
    lore_act3_desc: 'Guie Zé-G com seu feixe gravitacional! Descarte os resíduos, fuja de materiais voláteis e salve a Orbital Haven!',

    // HUD & Ingame
    level: 'Câmara',
    sector: 'Setor',
    attempts: 'Tentativas',
    score: 'Pontos',
    stars: 'Estrelas',
    timer: 'Tempo',
    health: 'Integridade',
    gravity_charge: 'Carga Gravitacional',
    gravity_ready: 'PRONTO! Ativar Pulso de Gravidade!',
    tractor_beam: 'Feixe de Tração',
    magnetic_hands: 'Mãos Magnéticas',
    paused: 'Jogo Pausado',
    resume: 'Continuar',
    restart: 'Reiniciar',
    menu: 'Câmaras',
    trash: 'Detritos',
    trash_disposed_hud: 'Limpas',

    // Modals
    level_cleared: 'Câmara Limpa!',
    level_failed: 'Brecha na Estação!',
    level_failed_desc: 'Zé-G sofreu danos críticos! Use um Kit de Emergência para reviver aqui agora.',
    congrats: 'Faxina Espetacular!',
    stars_collected: 'Estrelas Coletadas',
    time_taken: 'Tempo',
    trash_disposed: 'Resíduos Descartados',
    double_rewards: 'Dobrar Estrelas e Moedas (2x)',
    revive_btn: 'Reviver 1x (Kit de Emergência)',
    next_level: 'Próxima Câmara ➔',
    try_again: 'Tentar Novamente 🔄',
    level_select: 'Selecionar Câmara',
    locked: 'Bloqueada',
    all_levels_beaten: 'Você limpou toda a estação Orbital Haven! Você é um Zelador Lendário!',
    checkpoint_saved: 'Checkpoint Salvo!',
    checkpoint_ad_btn: 'Salvar Checkpoint (Anúncio)',

    // Settings
    settings: 'Configurações',
    settings_audio: 'Áudio e Música',
    settings_master_vol: 'Volume Geral',
    settings_bgm_vol: 'Música (BGM)',
    settings_sfx_vol: 'Efeitos Sonoros',
    settings_mute_all: 'Silenciar Todo Áudio',
    settings_unmute_all: 'Ativar Áudio',
    settings_video: 'Gráficos e Visual',
    settings_quality: 'Qualidade Visual',
    settings_quality_high: 'Alta Definição',
    settings_quality_low: 'Desempenho',
    settings_trajectory: 'Exibir Alcance do Feixe de Tração',
    settings_shake: 'Efeitos de Tremor de Tela',
    settings_lang: 'Idioma',
    settings_reset: 'Zerar Todo o Progresso',
    settings_reset_confirm: 'Tem certeza que deseja zerar todas as estrelas e o progresso?',
    settings_close: 'Salvar e Fechar',

    // Controls
    controls_title: 'Controles',
    controls_wasd: 'WASD / Setas — Propulsores de Movimento',
    controls_mouse: 'Clique e Segure o Mouse — Feixe de Tração',
    controls_space: 'Espaço — Pulso de Gravidade',
    controls_shift: 'Shift — Agarrar/Soltar com Mãos Magnéticas',
    controls_touch: 'Toque: Lado Esquerdo = Mover, Lado Direito = Ações'
  }
};

/**
 * Manages translation dictionaries, language switching, and event dispatching.
 */
export class I18nManager {
  constructor() {
    /** @type {'en' | 'pt-BR'} */
    this.currentLocale = this.detectLocale();
    /** @type {Array<(locale: string) => void>} */
    this.listeners = [];
  }

  /**
   * Detects initial locale from storage or browser navigator.
   * @returns {'en' | 'pt-BR'}
   */
  detectLocale() {
    try {
      // 1. Check saved preference in storage if available
      const savedLang = storage && typeof storage.data?.lang === 'string' ? storage.data.lang : null;
      if (savedLang === 'pt-BR' || savedLang === 'pt') return 'pt-BR';
      if (savedLang === 'en') return 'en';

      // 2. Detect from browser environment
      const navLang = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en';
      return /^pt/i.test(navLang) ? 'pt-BR' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  /**
   * Returns current active locale code ('en' or 'pt-BR').
   * @returns {'en' | 'pt-BR'}
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * Alias for getLocale()
   * @returns {'en' | 'pt-BR'}
   */
  getLang() {
    return this.currentLocale;
  }

  /**
   * Sets active locale, persists to storage, and dispatches change notification.
   * @param {'en' | 'pt-BR' | string} locale
   */
  setLocale(locale) {
    const normalized = (locale === 'pt-BR' || locale === 'pt') ? 'pt-BR' : 'en';
    if (this.currentLocale !== normalized) {
      this.currentLocale = normalized;
      
      try {
        if (storage && storage.data) {
          storage.data.lang = normalized;
          storage.save();
        }
      } catch (e) {
        // storage persistence fallback
      }

      this.notify();
    }
  }

  /**
   * Alias for setLocale()
   * @param {string} lang
   */
  setLang(lang) {
    this.setLocale(lang);
  }

  /**
   * Toggles between 'en' and 'pt-BR'.
   * @returns {'en' | 'pt-BR'}
   */
  toggleLocale() {
    const next = this.currentLocale === 'en' ? 'pt-BR' : 'en';
    this.setLocale(next);
    return next;
  }

  /**
   * Alias for toggleLocale()
   * @returns {'en' | 'pt-BR'}
   */
  toggleLang() {
    return this.toggleLocale();
  }

  /**
   * Translates a dictionary key into active language string.
   * Fallback priority: Active language -> English -> Key string
   * @param {string} key - Dictionary key
   * @returns {string}
   */
  t(key) {
    const dict = DICTIONARY[this.currentLocale] || DICTIONARY['en'];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const fallback = DICTIONARY['en'];
    if (fallback && fallback[key] !== undefined) {
      return fallback[key];
    }
    return String(key);
  }

  /**
   * Subscribes a listener to locale change events.
   * @param {(locale: string) => void} callback
   */
  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Dispatches change event to all subscribers and the window.
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentLocale);
      } catch (err) {
        console.error('[i18n] Error in locale change listener:', err);
      }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('locale-changed', {
          detail: { locale: this.currentLocale }
        }));
      } catch (e) {}
    }
  }
}

export const i18n = new I18nManager();
export default i18n;
