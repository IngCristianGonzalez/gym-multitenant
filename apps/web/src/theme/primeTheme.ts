import laraLight from 'primereact/resources/themes/lara-light-green/theme.css?url';
import laraDark from 'primereact/resources/themes/lara-dark-green/theme.css?url';

export function applyPrimeTheme(theme: 'light' | 'dark') {
  let link = document.getElementById('prime-theme') as HTMLLinkElement | null;
  const href = theme === 'dark' ? laraDark : laraLight;
  if (!link) {
    link = document.createElement('link');
    link.id = 'prime-theme';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}
