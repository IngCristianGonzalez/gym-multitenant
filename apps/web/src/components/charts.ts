import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export const brandColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#2b8a3e';

export const textColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--c-text-muted').trim() || '#656d76';

export const gridColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--c-border').trim() || '#d0d7de';

export const baseOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: textColor(), font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: gridColor(), drawBorder: false },
      ticks: { color: textColor(), font: { size: 11 }, maxTicksLimit: 6 },
      border: { display: false },
    },
  },
});

export const doughnutOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: textColor(), boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14, font: { size: 11 } },
    },
    tooltip: { padding: 10, cornerRadius: 8 },
  },
});

// Paleta pastel coherente con los badges
export const pastelPalette = {
  green: '#4ade80',
  blue: '#60a5fa',
  amber: '#fbbf24',
  red: '#f87171',
  purple: '#c084fc',
  gray: '#9ca3af',
};
