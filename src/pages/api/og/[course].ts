import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';

export const prerender = false;

const courses: Record<string, {
  title: string; line2?: string; subtitle: string;
  accent: string; bg: string; cardBg: string;
  emoji: string; tag: string;
}> = {
  'curso-wazuh': {
    title: 'Wazuh en Español',
    subtitle: 'SIEM · XDR · Cumplimiento ENS · +80 alumnos',
    accent: '#8b5cf6',
    bg: '#0a0415',
    cardBg: 'rgba(139,92,246,0.12)',
    emoji: '🛡️',
    tag: 'DISPONIBLE AHORA · 50€',
  },
  'curso-techai-boost': {
    title: 'TechIA Boost',
    line2: 'Ahorra 10h/semana',
    subtitle: 'Productividad con IA para Administradores de Sistemas',
    accent: '#00ff41',
    bg: '#060a06',
    cardBg: 'rgba(0,255,65,0.08)',
    emoji: '⚡',
    tag: 'LISTA DE ESPERA · 7 JUL 2026 · 50€',
  },
  'curso-seo-geo-claude': {
    title: 'SEO + GEO',
    line2: 'con Claude',
    subtitle: 'Posiciónate en Google, ChatGPT y Perplexity',
    accent: '#f59e0b',
    bg: '#0d0800',
    cardBg: 'rgba(245,158,11,0.08)',
    emoji: '🔍',
    tag: 'LISTA DE ESPERA · 26 JUL 2026 · 50€',
  },
  'cursos': {
    title: 'Cursos de IA',
    subtitle: 'Wazuh · TechIA Boost · SEO+GEO con Claude',
    accent: '#60a5fa',
    bg: '#020817',
    cardBg: 'rgba(96,165,250,0.08)',
    emoji: '🎓',
    tag: '3 CURSOS · ACCESO PERMANENTE · DESDE 50€',
  },
};

export const GET: APIRoute = ({ params }) => {
  const courseId = (params.course || '').replace(/\.png$/, '');
  const c = courses[courseId] ?? courses['cursos'];

  const img = h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: c.bg,
      padding: '60px 72px',
      justifyContent: 'space-between',
      fontFamily: 'sans-serif',
    }
  },

    // TOP ROW
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      // Badge
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '10px',
          background: c.cardBg,
          border: `1px solid ${c.accent}55`,
          borderRadius: '6px', padding: '8px 18px',
          fontSize: '14px', color: c.accent,
          letterSpacing: '0.12em', fontWeight: 700,
        }
      },
        h('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: c.accent, display: 'inline-block' } }),
        c.tag
      ),
      // Brand
      h('div', {
        style: { fontSize: '18px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }
      }, 'AI SECURITY')
    ),

    // CENTER
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
      // Emoji
      h('div', { style: { fontSize: '64px', lineHeight: '1' } }, c.emoji),
      // Title
      h('div', {
        style: {
          fontSize: c.line2 ? '80px' : '88px',
          fontWeight: 900,
          color: c.accent,
          lineHeight: '0.95',
          letterSpacing: '-3px',
        }
      }, c.title),
      // Line 2 (if any)
      c.line2 ? h('div', {
        style: {
          fontSize: '64px', fontWeight: 900,
          color: 'white', lineHeight: '0.95',
          letterSpacing: '-2px',
        }
      }, c.line2) : null,
      // Subtitle
      h('div', {
        style: {
          fontSize: '26px', color: 'rgba(255,255,255,0.6)',
          fontWeight: 400, marginTop: '4px',
        }
      }, c.subtitle),
    ),

    // BOTTOM
    h('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: '24px',
      }
    },
      h('div', { style: { fontSize: '20px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' } }, 'aisecurity.es'),
      h('div', {
        style: {
          fontSize: '22px', fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.04em',
        }
      }, 'Vídeos grabados · Comunidad · Actualizaciones')
    )
  );

  return new ImageResponse(img, {
    width: 1200,
    height: 630,
  });
};