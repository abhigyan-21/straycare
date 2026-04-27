export const adminStats = {
    adoptions: 12,
    rescues: 24,
    urgentReports: 8,
    funding: "₹45,200",
    month: "April 2026"
};

export const recentActivity = [
    {
        id: 1,
        type: 'adoption',
        title: 'New Adoption Request',
        description: 'Bella was requested by Amit S.',
        time: '2h ago',
        icon: 'heart'
    },
    {
        id: 2,
        type: 'emergency',
        title: 'Emergency Report',
        description: 'Injured stray reported in Downtown',
        time: '5h ago',
        icon: 'alert'
    },
    {
        id: 3,
        type: 'partner',
        title: 'New Partner Application',
        description: 'Happy Tails NGO applied',
        time: 'Yesterday',
        icon: 'user'
    }
];

export const mockUsers = [
    { id: 1, name: 'Helping Paws NGO', email: 'contact@helpingpaws.org', role: 'ngo', status: 'Active', joined: '2025-10-12' },
    { id: 2, name: 'City Vet Clinic', email: 'dr.smith@cityvet.com', role: 'partner', status: 'Active', joined: '2025-12-05' },
    { id: 3, name: 'Rescue Rangers', email: 'info@rrangers.org', role: 'ngo', status: 'Pending', joined: '2026-03-08' },
    { id: 4, name: 'Abhigyan Kumar', email: 'abhigyan@example.com', role: 'user', status: 'Active', joined: '2026-04-01' },
    { id: 5, name: 'Dr. Rahul Sharma', email: 'rahul@vetclinic.com', role: 'partner', status: 'Active', joined: '2026-04-10' },
];

export const mockDocuments = [
    { id: 'DOC-101', title: 'Medical History - Bella', type: 'PDF', size: '2.4 MB', date: '2026-03-08' },
    { id: 'DOC-102', title: 'Adoption Agreement Form', type: 'DOCX', size: '1.1 MB', date: '2026-03-01' },
    { id: 'DOC-103', title: 'NGO Verification - Helping Paws', type: 'PDF', size: '3.5 MB', date: '2026-02-15' }
];

export const mockTracking = [
    { id: 'TRK-001', name: "Bella (Stray)", type: "Dog", reporter: "John Doe", status: "Reported", date: "2026-03-08", location: "Downtown Park" },
    { id: 'TRK-002', name: "Luna", type: "Cat", reporter: "Jane Smith", status: "Rescue in Progress", date: "2026-03-07", location: "Northside Alley" },
    { id: 'TRK-003', name: "Max", type: "Dog", reporter: "Mike Ross", status: "At Clinic", date: "2026-03-05", location: "East Ave" },
];

export const mockPosts = [
    { id: 1, author: 'Jane Smith', authorAvatar: 'https://i.pravatar.cc/150?u=jane', content: 'Found a stray dog near Central Park. Please share! He looks hungry but friendly.', date: '2 hours ago', status: 'Published', reports: 0 },
    { id: 2, author: 'John Doe', authorAvatar: 'https://i.pravatar.cc/150?u=john', content: 'Here are some tips for fostering cats in summer. Keep them hydrated and avoid direct sun during peak hours.', date: '5 hours ago', status: 'Published', reports: 0 },
    { id: 3, author: 'SpamBot', authorAvatar: 'https://i.pravatar.cc/150?u=spam', content: 'Click here for free dog food!!! Limited time offer! NO SCAM!! 100% REAL!!', date: '1 day ago', status: 'Reported', reports: 12 },
    { id: 4, author: 'Mike Ross', authorAvatar: 'https://i.pravatar.cc/150?u=mike', content: 'Aggressive dog spotted near the subway entrance. Be careful everyone.', date: '3 days ago', status: 'Pending', reports: 2 }
];
