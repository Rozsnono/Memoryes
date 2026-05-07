export type MemoryType = 'image' | 'video' | 'live';

export interface Memory {
    id: string;
    title: string;
    description: string;
    type: MemoryType;
    url: string;
    date: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    perspectives: {
        userName: string;
        avatar: string;
        content: string;
    }[];
    isPinned: boolean;
    tags: string[];
}

export const DUMMY_MEMORIES: Memory[] = [
    {
        id: '1',
        title: 'Első közös balatoni nyár',
        description: 'A naplemente utáni pillanat, amikor még mindenki nevetett.',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206',
        date: '2025.07.12',
        location: { lat: 46.88, lng: 17.88, address: 'Balatonfüred, Tagore sétány' },
        perspectives: [
            { userName: 'Anna', avatar: 'https://i.pravatar.cc/150?u=anna', content: 'Imádtam azt a fagyit a parton!' },
            { userName: 'Peti', avatar: 'https://i.pravatar.cc/150?u=peti', content: 'Kicsit fújt a szél, de a látvány kárpótolt.' }
        ],
        isPinned: true,
        tags: ['nyár', 'család']
    },
];