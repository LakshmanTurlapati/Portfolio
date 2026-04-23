export interface LegacyChatTheme {
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  softBorder: string;
  strongerBorder: string;
  hoverFill: string;
  inputFill: string;
  inputText: string;
  inputPlaceholder: string;
  chipFill: string;
  userBubbleFill: string;
  userBubbleBorder: string;
  assistantBubbleFill: string;
  assistantBubbleBorder: string;
  focus: string;
  statusHealthy: string;
  statusError: string;
  controlFill: string;
  controlBorder: string;
}

export function getLegacyChatTheme(isDark: boolean): LegacyChatTheme {
  return {
    surface: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    foreground: isDark ? '#000000' : '#ffffff',
    muted: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    border: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
    softBorder: isDark ? 'rgba(189,189,189,0.3)' : 'rgba(97,97,97,0.2)',
    strongerBorder: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    hoverFill: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    inputFill: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
    inputText: isDark ? '#424242' : '#808080',
    inputPlaceholder: isDark ? '#757575' : '#bdbdbd',
    chipFill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    userBubbleFill: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)',
    userBubbleBorder: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
    assistantBubbleFill: isDark ? 'rgba(224,224,224,0.7)' : 'rgba(66,66,66,0.6)',
    assistantBubbleBorder: isDark ? 'rgba(189,189,189,0.3)' : 'rgba(97,97,97,0.2)',
    focus: isDark ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.46)',
    statusHealthy: '#00E676',
    statusError: '#ef4444',
    controlFill: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    controlBorder: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)',
  };
}
