export interface User {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface Memory {
    id: string;
    imageUrl: string;
    title: string;
    location: string;
    date: string;
}

export interface DashboardData {
    users: User[];
    startDate: string;
    stats: { cities: number; countries: number };
    latestMemory: Memory;
    topLocation: { name: string; memoryCount: number };
}