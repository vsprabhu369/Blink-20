import { ThemeVariantId } from './types';

export interface DarkThemeVariant {
  id: ThemeVariantId;
  name: string;
  subtitle: string;
  bgHex: string;
  bgClass: string;
  surfaceClass: string;
  surfaceHoverClass: string;
  borderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  textMutedClass: string;
  workAccentHex: string;
  workAccentClass: string;
  workButtonClass: string;
  workSoftBgClass: string;
  restAccentHex: string;
  restAccentClass: string;
  restButtonClass: string;
  restSoftBgClass: string;
  ringTrackHex: string;
}

export const DARK_THEMES: Record<ThemeVariantId, DarkThemeVariant> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    subtitle: 'True OLED black with warm amber & emerald',
    bgHex: '#09090b',
    bgClass: 'bg-[#09090b]',
    surfaceClass: 'bg-[#121216]',
    surfaceHoverClass: 'hover:bg-[#1a1a20]',
    borderClass: 'border-zinc-800/80',
    textPrimaryClass: 'text-zinc-100',
    textSecondaryClass: 'text-zinc-300',
    textMutedClass: 'text-zinc-400',
    workAccentHex: '#f59e0b',
    workAccentClass: 'text-amber-400',
    workButtonClass: 'bg-amber-500 text-zinc-950 hover:bg-amber-400',
    workSoftBgClass: 'bg-amber-500/12',
    restAccentHex: '#10b981',
    restAccentClass: 'text-emerald-400',
    restButtonClass: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400',
    restSoftBgClass: 'bg-emerald-500/12',
    ringTrackHex: '#27272a',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Slate',
    subtitle: 'Deep navy charcoal with sky blue & teal',
    bgHex: '#080d16',
    bgClass: 'bg-[#080d16]',
    surfaceClass: 'bg-[#101827]',
    surfaceHoverClass: 'hover:bg-[#172236]',
    borderClass: 'border-slate-800/90',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-slate-300',
    textMutedClass: 'text-slate-400',
    workAccentHex: '#38bdf8',
    workAccentClass: 'text-sky-400',
    workButtonClass: 'bg-sky-400 text-slate-950 hover:bg-sky-300',
    workSoftBgClass: 'bg-sky-400/12',
    restAccentHex: '#2dd4bf',
    restAccentClass: 'text-teal-400',
    restButtonClass: 'bg-teal-400 text-slate-950 hover:bg-teal-300',
    restSoftBgClass: 'bg-teal-400/12',
    ringTrackHex: '#1e293b',
  },
  forest: {
    id: 'forest',
    name: 'Forest Dusk',
    subtitle: 'Deep pine dark with sage lime & mint',
    bgHex: '#070f0b',
    bgClass: 'bg-[#070f0b]',
    surfaceClass: 'bg-[#0f1c15]',
    surfaceHoverClass: 'hover:bg-[#16271e]',
    borderClass: 'border-emerald-950/90',
    textPrimaryClass: 'text-stone-100',
    textSecondaryClass: 'text-stone-300',
    textMutedClass: 'text-stone-400',
    workAccentHex: '#a3e635',
    workAccentClass: 'text-lime-400',
    workButtonClass: 'bg-lime-400 text-stone-950 hover:bg-lime-300',
    workSoftBgClass: 'bg-lime-400/12',
    restAccentHex: '#34d399',
    restAccentClass: 'text-emerald-400',
    restButtonClass: 'bg-emerald-400 text-stone-950 hover:bg-emerald-300',
    restSoftBgClass: 'bg-emerald-400/12',
    ringTrackHex: '#1a2e22',
  },
  velvet: {
    id: 'velvet',
    name: 'Velvet Ash',
    subtitle: 'Warm espresso dark with coral & soft lime',
    bgHex: '#110d0c',
    bgClass: 'bg-[#110d0c]',
    surfaceClass: 'bg-[#1b1513]',
    surfaceHoverClass: 'hover:bg-[#251d1a]',
    borderClass: 'border-stone-800/80',
    textPrimaryClass: 'text-stone-100',
    textSecondaryClass: 'text-stone-300',
    textMutedClass: 'text-stone-400',
    workAccentHex: '#fb7185',
    workAccentClass: 'text-rose-400',
    workButtonClass: 'bg-rose-400 text-stone-950 hover:bg-rose-300',
    workSoftBgClass: 'bg-rose-400/12',
    restAccentHex: '#4ade80',
    restAccentClass: 'text-green-400',
    restButtonClass: 'bg-green-400 text-stone-950 hover:bg-green-300',
    restSoftBgClass: 'bg-green-400/12',
    ringTrackHex: '#2b221f',
  },
};

export const THEME_LIST: DarkThemeVariant[] = [
  DARK_THEMES.obsidian,
  DARK_THEMES.midnight,
  DARK_THEMES.forest,
  DARK_THEMES.velvet,
];
