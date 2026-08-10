import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          soft: "var(--brand-soft)",
          deep: "var(--brand-deep)",
          mist: "var(--brand-mist)",
          wash: "var(--brand-wash)",
        },
        bg: {
          DEFAULT: "var(--bg)",
          elevated: "var(--bg-elevated)",
          muted: "var(--bg-muted)",
          subtle: "var(--bg-subtle)",
          inverse: "var(--bg-inverse)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        ink: {
          DEFAULT: "var(--text)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
          link: "var(--text-link)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
          text: "var(--success-text)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
          text: "var(--warning-text)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
          text: "var(--danger-text)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
          text: "var(--info-text)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-bg)",
          border: "var(--sidebar-border)",
          text: "var(--sidebar-text)",
          active: "var(--sidebar-active)",
          hover: "var(--sidebar-hover)",
          "text-active": "var(--sidebar-text-active)",
        },
        topbar: {
          DEFAULT: "var(--topbar-bg)",
          border: "var(--topbar-border)",
        },
        primary: {
          DEFAULT: "var(--brand)",
          light: "var(--brand-soft)",
          dark: "var(--brand-deep)",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          light: "var(--bg-muted)",
          dark: "var(--border-strong)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        auth: "var(--shadow-auth)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
      },
    },
  },
  plugins: [],
} satisfies Config;
