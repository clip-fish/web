// src/utils/deviceUtils.ts
import { v4 as uuidv4 } from "uuid";

export const getDeviceId = (): string => {
    const storedId = localStorage.getItem("deviceId") || uuidv4();
    localStorage.setItem("deviceId", storedId);
    return storedId;
};

export const getDeviceName = (): string => {
    const ua = navigator.userAgent;
    if (ua.match(/iPhone/i)) return "iPhone";
    if (ua.match(/iPad/i)) return "iPad";
    if (ua.match(/Mac/i)) return "MacBook";
    if (ua.match(/Android/i)) return "Android Phone";
    if (ua.match(/Windows/i)) return "Windows PC";
    if (ua.match(/Linux/i)) return "Linux Device";
    return "Unknown Device";
};
