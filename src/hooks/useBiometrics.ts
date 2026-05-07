// hooks/useBiometrics.ts
import { NativeBiometric } from 'capacitor-native-biometric';

export const useBiometrics = () => {
    const isAvailable = async () => {
        try {
            const result = await NativeBiometric.isAvailable();
            return result.isAvailable;
        } catch {
            return false;
        }
    };

    const verify = async () => {
        try {
            const verified = await NativeBiometric.verifyIdentity({
                reason: "Secure your vault",
                title: "Biometric Login",
                description: "Verify your identity to continue",
            });
            return true;
        } catch {
            return false;
        }
    };

    return { isAvailable, verify };
};