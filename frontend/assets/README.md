# Vetra SVG Icons Reference

Este diretório contém todos os ícones e assets SVG usados na extensão Vetra.

## 📁 Estrutura e Nomenclatura

### **Logos**
- `logo.svg` - Logo principal da Vetra (V dourado sobre fundo preto, 800x800)
- `logo-google.svg` - Logo do Google (para integração OAuth/Sign-in)

### **Ícones de Status** (Risk Indicators)
- `icon-success.svg` - Círculo verde com check (✓) - Transação segura
- `icon-warning.svg` - Triângulo amarelo com ! - Risco médio
- `icon-forbidden.svg` - Círculo vermelho com X - Alto risco/Bloqueado

### **Ícones de Ação**
- `icon-play.svg` - Ícone de play/executar (seta para direita)
- `icon-external-link.svg` - Link externo (seta diagonal amarela)
- `icon-history.svg` - Histórico (relógio com seta)
- `icon-lock.svg` - Cadeado (segurança/privacidade)
- `icon-droplet.svg` - Gota (alerta/atenção dourada)

### **Ícones de Estado**
- `icon-blocked.svg` - Bloqueado (círculo branco com linha diagonal)
- `icon-verified.svg` - Verificado (check circular com progresso)
- `icon-payment-card.svg` - Cartão de pagamento (transações)

### **Botões**
- `button-back.svg` - Botão voltar (seta esquerda em fundo escuro, 32x32)
- `button-favorite.svg` - Botão favorito/estrela (32x32)

## 🎨 Paleta de Cores

### Cores Primárias
- `#FBB500` - Dourado principal (logo, alertas)
- `#E69B50` - Dourado secundário

### Cores de Status
- `#00D386` - Verde (sucesso)
- `#F5A524` / `#FFC430` - Amarelo/Laranja (warning)
- `#AC1010` / `#DA145D` - Vermelho (erro/alto risco)

### Cores de UI
- `#1E1E1E` - Background cards
- `#E6E6E6` / `#FFFFFF` - Texto/ícones brancos
- `#858C94` / `#71717A` - Cinza (elementos secundários)
- `#1A141F` - Texto escuro

## 📐 Dimensões Padrão

- **Ícones pequenos**: 16x16px (ícones de status, ações)
- **Botões**: 32x32px (botões de navegação)
- **Logos**: 800x800px (logo principal), variável (logo Google)

## 🔄 Uso no Projeto

Estes SVGs devem ser:
1. Importados como componentes React no frontend
2. Otimizados com SVGO durante o build
3. Usados com cores configuráveis via props quando possível

### Exemplo de uso:
```tsx
import IconSuccess from '@/assets/svg/icon-success.svg';

<IconSuccess className="w-4 h-4" />
```

## 📝 Convenções de Nomenclatura

- `icon-*` - Ícones funcionais (16x16 ou 17x17)
- `logo-*` - Logos de marcas
- `button-*` - Componentes de botão completos (32x32)
- `risk-score-*` - Componentes de visualização de score

---

**Última atualização**: 14/10/2025
**Projeto**: Vetra - Chrome Extension for Solana Transaction Security

