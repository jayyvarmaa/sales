const USERS = [
    // Master Admin
    {
        _id: '64e6b2e5a7b3e8c9d1e2f3a0',
        name: 'Alex Chen',
        email: 'master@salesportal.com',
        password: 'password123',
        role: 'master',
        countryCode: 'CN',
        avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=random',
        managerId: null
    },
    // US Manager (Kodi)
    {
        _id: '64e6b2e5a7b3e8c9d1e2f3a1',
        name: 'Kodi Williams',
        email: 'kodi@salesportal.com',
        password: 'password123',
        role: 'manager',
        countryCode: 'US',
        avatar: 'https://ui-avatars.com/api/?name=Kodi+Williams&background=random',
        managerId: null
    },
    // US Rep (Sarah) - Reports to Kodi
    {
        _id: '64e6b2e5a7b3e8c9d1e2f3a2',
        name: 'Sarah Johnson',
        email: 'sarah@salesportal.com',
        password: 'password123',
        role: 'rep',
        countryCode: 'US',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
        managerId: '64e6b2e5a7b3e8c9d1e2f3a1'
    },
    // CN Manager
    {
        _id: '64e6b2e5a7b3e8c9d1e2f3a3',
        name: 'Wei Zhang',
        email: 'wei@salesportal.com',
        password: 'password123',
        role: 'manager',
        countryCode: 'CN',
        avatar: 'https://ui-avatars.com/api/?name=Wei+Zhang&background=random',
        managerId: null
    },
    // IN Manager
    {
        _id: '64e6b2e5a7b3e8c9d1e2f3a4',
        name: 'Priya Sharma',
        email: 'priya@salesportal.com',
        password: 'password123',
        role: 'manager',
        countryCode: 'IN',
        avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random',
        managerId: null
    }
];

module.exports = USERS;
