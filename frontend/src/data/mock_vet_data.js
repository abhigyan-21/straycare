export const ADOPT_STATUS_OPTIONS = [
    { label: 'up for adoption', value: 'up for adoption', class: 'up-for-adoption' },
    { label: 'Adopted', value: 'Adopted', class: 'adopted' },
    { label: 'Remove', value: 'Remove', class: 'remove' }
];

export const MOCK_ADOPT_DATA = {
    todaysInterviews: [
        { id: 'PET-203', petId: 'P001', adopteeName: 'John Doe', contact: '+1 234 567 890', time: '10:30 AM' },
        { id: 'PET-204', petId: 'P005', adopteeName: 'Jane Smith', contact: '+1 987 654 321', time: '02:15 PM' },
    ],
    liveAdoptions: [
        { id: 'PET-101', petName: 'Buddy', status: 'up for adoption', image: null },
        { id: 'PET-102', petName: 'Luna', status: 'Adopted', image: null },
        { id: 'PET-103', petName: 'Max', status: 'Remove', image: null },
    ],
    currentRequests: [
        { id: 'REQ-501', name: 'Alice Wilson', contact: 'alice@example.com', status: 'interview' },
        { id: 'REQ-502', name: 'Bob Brown', contact: 'bob.b@example.com', status: 'cancelled' },
    ],
    newRequests: [
        { id: 'REQ-601', name: 'Charlie Davis', contact: 'charlie.d@gmail.com' },
        { id: 'REQ-602', name: 'Diana Prince', contact: 'diana.p@outlook.com' },
    ]
};

export const MOCK_CAMPAIGNS = [
    {
        id: 'CAMP-001',
        title: 'Support feeding our pets',
        description: 'Providing warm blankets and insulated shelters for 50+ stray dogs in the northern suburbs.',
        purpose: 'To ensure every stray animal in the northern suburbs has access to nutritional food and warm shelter during the winter months.',
        goalAmount: 5000,
        raisedAmount: 3250,
        volunteers: 24,
        volunteersList: ['Sarah Connor', 'James Smith', 'Emily Blunt', 'Mark Ruffalo', 'Scarlett J.'],
        startDate: '2026-11-01',
        endDate: '2026-12-25',
        startTime: '09:00 AM',
        location: 'Northern Suburbs Community Center',
        status: 'active',
        theme: 'blue',
        image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop'
    },
    {
        id: 'CAMP-002',
        title: 'Support treatment of our pets',
        description: 'Raising funds for critical surgeries and medical supplies for accident-prone areas.',
        purpose: 'Providing emergency medical care and long-term rehabilitation for animals injured in road accidents.',
        goalAmount: 8000,
        raisedAmount: 1200,
        volunteers: 8,
        volunteersList: ['Dr. Aris', 'Nurse Joy', 'Peter Parker'],
        startDate: '2026-04-15',
        endDate: '2026-05-15',
        startTime: '10:00 AM',
        location: 'Central Veterinary Hospital',
        status: 'active',
        theme: 'green',
        image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1600&auto=format&fit=crop'
    },
    {
        id: 'CAMP-003',
        title: 'Support providing shelter for our pets',
        description: 'Anti-rabies and DHPP vaccination drive for street animals in Sector 4 and 5.',
        purpose: 'Eradicating rabies and ensuring the health of the stray population through massive vaccination drives.',
        goalAmount: 3000,
        raisedAmount: 3000,
        volunteers: 45,
        volunteersList: ['Tony Stark', 'Steve Rogers', 'Natasha R.'],
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        startTime: '08:00 AM',
        location: 'Sector 4 Public Park',
        status: 'active',
        theme: 'yellow',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop'
    }
];

export const MOCK_RESCUERS = [
    { id: '1', name: 'Rahul Sharma', email: 'rahul@example.com', contact: '+91 98765 43210', avatarUrl: null },
    { id: '2', name: 'Sneha Patel', email: 'sneha@example.com', contact: '+91 99887 76655', avatarUrl: null },
];

export const MOCK_DASHBOARD_DATA = {
    rescues: [
        { id: 'REP-7729', description: 'Golden Retriever found near Central Park with a leg injury.', status: 'in transit', image: null },
        { id: 'REP-8102', description: 'Stray cat trapped in a drain near sector 5.', status: 'reached clinic', image: null },
        { id: 'REP-9003', description: 'Wounded beagle reported near the bypass.', status: 'pickup', image: null },
        { id: 'REP-1104', description: 'Sick puppy found in a box near the market.', status: 'in transit', image: null },
        { id: 'REP-2205', description: 'Injured bird rescued from a rooftop.', status: 'pickup', image: null }
    ],
    stats: {
        liveAdoptions: 5,
        newRequests: 3,
        liveRequests: 3,
        latestCampaign: {
            title: 'Winter Shelter Drive',
            date: '25th Dec'
        }
    }
};
