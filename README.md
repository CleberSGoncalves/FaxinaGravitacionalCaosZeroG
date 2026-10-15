# 🛸 Faxina Gravitacional: Caos Zero-G! (Gravitational Cleanup: Zero-G Chaos!)

> 🎮 Jogo WebGL / HTML5 de Quebra-Cabeça de Física & Ragdoll em Gravidade Zero, desenvolvido sob o selo **FluidCleb Interactive** e 100% homologado para publicação no **CrazyGames**.

---

## 🌟 Visão Geral & Especificações

- **Título Comercial**: Faxina Gravitacional: Caos Zero-G! (*Gravitational Cleanup: Zero-G Chaos!*)
- **URL Pública de Produção**: [https://faxinagravitacionalcaoszerog.kinomuse.com.br](https://faxinagravitacionalcaoszerog.kinomuse.com.br)
- **Repositório GitHub**: [https://github.com/CleberSGoncalves/FaxinaGravitacionalCaosZeroG](https://github.com/CleberSGoncalves/FaxinaGravitacionalCaosZeroG)
- **Gênero / Estilo**: Physics Puzzle / Zero-G Ragdoll
- **Engine & Renderizador**: Canvas 2D / WebGL de Alta Fidelidade + Godot 4.7.2 2D (gl_compatibility)
- **Plataforma Alvo**: CrazyGames (Desktop & Mobile)
- **Resolução Lógica**: `960 x 540` (16:9 responsivo com Letterbox/Pillarbox centralizado)
- **Tamanho do Bundle de Produção**: `< 1 MB` (JS: ~152 KB, CSS: ~27 KB)
- **Tempo de Carga**: `< 1 segundo` (Gráficos 100% procedurais e áudio sintetizado em runtime via Web Audio API)

---

## 📖 Lore & Ambientação

A bordo da estação espacial **Orbital Haven**, o zelador desajeitado **Zé-G** está enfrentando o maior pandemônio de sua carreira: o núcleo gravitacional colapsou, lançando resíduos tóxicos e detritos soltos em gravidade zero. Armado com seu traje de impulsão e seu dispositivo gravitacional, Zé-G precisa incinerar o lixo antes que a estação se torne uma ameaça intergaláctica.

---

## 🎮 Controles & Gameplay

### Desktop (Teclado & Mouse)
- **WASD / Setas**: Acionamento dos propulsores de Zé-G
- **Mouse (Clique Esquerdo & Segurar)**: Feixe de Tração Gravitacional (*Tractor Beam*)
- **Espaço**: Pulso Gravitacional Radial (*Gravity Pulse*)
- **Shift / Clique Direito**: Mãos Magnéticas (*Magnetic Hands*) para agarrar e arremessar detritos
- **R**: Reiniciar câmara (ou voltar ao Checkpoint)
- **P / Esc**: Pausar jogo

### Dispositivos Móveis (Touchscreen)
- **Joystick Virtual**: Posicionado no canto inferior esquerdo para controle do impulso
- **Botões de Ação**: Feixe de Tração, Pulso de Gravidade e Mãos Magnéticas no canto inferior central

---

## 🧩 Módulos & Mecânicas Principais

1. **Propulsor de Impulso de Lixo**: Movimentação com conservação de inércia e emissão de partículas de exaustão.
2. **Mãos Magnéticas**: Pinças que ancoram objetos a Zé-G com arcos elétricos e arremesso vetorial.
3. **Feixe de Tração (Tractor Beam)**: Cone energético de sucção que atrai e alinha objetos distantes no vácuo.
4. **Geradores Gravitacionais Ativos**: Dispositivos que atraem detritos e recarregam a energia de emergência.
5. **Resíduos Instáveis Voláteis**: Tambores radioativos sensíveis a impacto; colisões violentas causam explosões em área.
6. **Checkpoints Mid-Level**: Sinalizadores de salvamento holográficos para níveis longos.
7. **15 Níveis Progressivos**: 5 setores temáticos com complexidade e desafios crescentes.

---

## 💰 Integração CrazyGames SDK v3

- **Script Oficial**: Carregado no `<head>` via CDN oficial da CrazyGames.
- **Ciclo de Vida de Partida**: Chamadas estritas de `gameplayStart()` e `gameplayStop()`.
- **Mute & Pausa em Anúncios**: Congelamento do acumulador de física e mutação de áudio durante a reprodução de anúncios (`adStarted` -> mute/freeze; `adFinished`/`adError` -> resume).
- **Rewarded Ad 1 (Revive)**: Revive Zé-G 1x por tentativa com 3 segundos de invulnerabilidade. Se houver AdBlock (`adError`), nenhuma recompensa é concedida.
- **Rewarded Ad 2 (2x Recursos)**: Dobra moedas e sucata espacial ao concluir câmaras.
- **Midgame Ads**: Acionados estritamente em telas de vitória/derrota com intervalo mínimo de 180s ou a cada 3 fases.
- **Land in Gameplay**: Vinheta FluidCleb Interactive (0.0s a 2.8s) com botão **"Skip Story ➔"** presente para entrada no jogo em no máximo 1 clique.
- **Sem Botão de Fullscreen**: O canvas não inclui botão customizado, preservando o controle oficial do portal.

---

## 🛠️ Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev

# Compilar build de produção (Vite)
npm run build

# Pré-visualizar build de produção
npm run preview

# Sincronizar com GitHub
backup_github.bat
```

---

## 🛡️ Auditoria de Qualidade (QA)

- **Subagente 1 (Física & Delta Time)**: Validação de física invariante a 60Hz, 144Hz e 165Hz com fixed timestep (`FIXED_DT = 1/60s`), clamping anti-spiral-of-death e estabilidade do esqueleto Verlet/PBD. **Status: 100% APROVADO**.
- **Subagente 2 (CrazyGames SDK & UX)**: Validação de conformidade SDK v3, ciclos de gameplay, mute em anúncios, 1x revive seguro e responsividade. **Status: 100% APROVADO**.
