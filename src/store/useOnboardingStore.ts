import { create } from 'zustand';

type AppMode = 'personal' | 'couple' | 'family' | null;

interface OnboardingState {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    biometricsEnabled: boolean;
    setBiometrics: (enabled: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    mode: null,
    setMode: (mode) => set({ mode }),
    biometricsEnabled: false,
    setBiometrics: (enabled) => set({ biometricsEnabled: enabled }),
}));