import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useNativePermissions = () => {
    const checkCamera = async () => {
        if (!Capacitor.isNativePlatform()) return true;
        const status = await Camera.requestPermissions();
        return status.camera === 'granted';
    };

    const checkLocation = async () => {
        if (!Capacitor.isNativePlatform()) return true;
        const status = await Geolocation.requestPermissions();
        return status.location === 'granted';
    };

    const requestAllPermissions = async () => {
        if (!Capacitor.isNativePlatform()) return { camera: true, location: true };
        const cam = await Camera.requestPermissions();
        const loc = await Geolocation.requestPermissions();
        return {
            camera: cam.camera === 'granted',
            photos: cam.photos === 'granted',
            location: loc.location === 'granted'
        };
    };

    return { requestAllPermissions, checkCamera, checkLocation };
};