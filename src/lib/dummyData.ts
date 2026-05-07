export const MOCK_USER = {
    id: 'u1',
    name: 'Alex',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    role: 'Family Admin',
};

export const MOCK_MEMORIES = [
    {
        id: 'm1',
        title: 'Summer Solstice at the Coast',
        capturedAt: '2023-06-21T18:30:00Z',
        location: { name: 'Amalfi Coast, Italy', lat: 40.6333, lng: 14.6029 },
        isPinned: true,
        isFavorite: true,
        media: [
            { url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077', type: 'image' },
            { url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963', type: 'image' }
        ],
        perspectives: [
            { userId: 'u1', userName: 'Alex', content: "The light was perfect. I remember the smell of lemons in the air.", audioUrl: '#' },
            { userId: 'u2', userName: 'Jordan', content: "I was just happy we didn't get lost on those narrow roads!" }
        ]
    },
    {
        id: 'm2',
        title: 'First Steps',
        capturedAt: '2023-08-12T10:15:00Z',
        location: { name: 'Living Room', lat: 0, lng: 0 },
        isPinned: false,
        isFavorite: true,
        media: [
            { url: 'https://images.unsplash.com/photo-1519689689353-897c12360a7f', type: 'image' }
        ],
        perspectives: [
            { userId: 'u1', userName: 'Alex', content: "Caught it on camera! Pure magic." }
        ]
    },
    {
        id: 'm3',
        title: 'Mountain Hike',
        capturedAt: '2023-09-05T14:20:00Z',
        location: { name: 'Swiss Alps', lat: 46.8182, lng: 8.2275 },
        isPinned: false,
        isFavorite: false,
        media: [
            { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', type: 'image' }
        ],
        perspectives: []
    }
];