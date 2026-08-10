'use client';

/** Social OAuth is not wired to Nest yet — hide until backends exist. */
interface SocialAuthButtonsProps {
  mode: 'login' | 'register';
}

export function SocialAuthButtons(_props: SocialAuthButtonsProps) {
  return null;
}
