const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Lead = require('./models/Lead');
const AuditLog = require('./models/AuditLog');

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' }
];

const LEAD_TITLES = [
    'Enterprise SaaS Migration',
    'Cloud Infrastructure Deal',
    'Digital Transformation Project',
    'AI/ML Platform License',
    'Cybersecurity Upgrade',
    'ERP System Overhaul',
    'Mobile App Development',
    'Data Analytics Platform',
    'IoT Integration Project',
    'Blockchain Supply Chain'
];

const COMPANIES = [
    'TechCorp Global', 'Innovate Systems', 'DataFlow Inc', 'CloudNine Solutions',
    'Apex Industries', 'Vertex Technologies', 'Quantum Dynamics', 'SilverLine Corp',
    'OmniTech Labs', 'Pinnacle Enterprises'
];

const TAGS = ['enterprise', 'smb', 'saas', 'cloud', 'ai', 'security', 'mobile', 'analytics', 'iot', 'fintech'];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Lead.deleteMany({});
        await AuditLog.deleteMany({});
        console.log('Cleared existing data');

        // Create Master Admin
        const master = await User.create({
            name: 'Alex Chen',
            email: 'master@salesportal.com',
            password: 'password123',
            role: 'master',
            countryCode: 'CN'
        });
        console.log('Created master:', master.email);

        // Create Country Managers
        const managers = [];
        const managerData = [
            { name: 'Kodi Williams', email: 'kodi@salesportal.com', countryCode: 'US' },
            { name: 'Wei Zhang', email: 'wei@salesportal.com', countryCode: 'CN' },
            { name: 'Priya Sharma', email: 'priya@salesportal.com', countryCode: 'IN' }
        ];

        for (const m of managerData) {
            const manager = await User.create({
                ...m,
                password: 'password123',
                role: 'manager'
            });
            managers.push(manager);
            console.log(`Created manager: ${manager.email} (${manager.countryCode})`);
        }

        // Create Sales Reps (3 per country)
        const reps = [];
        const repData = [
            // US Reps
            { name: 'Sarah Johnson', email: 'sarah@salesportal.com', countryCode: 'US' },
            { name: 'Mike Davis', email: 'mike@salesportal.com', countryCode: 'US' },
            { name: 'Emily Brown', email: 'emily@salesportal.com', countryCode: 'US' },
            // CN Reps
            { name: 'Li Ming', email: 'liming@salesportal.com', countryCode: 'CN' },
            { name: 'Wang Fei', email: 'wangfei@salesportal.com', countryCode: 'CN' },
            { name: 'Zhang Hui', email: 'zhanghui@salesportal.com', countryCode: 'CN' },
            // IN Reps
            { name: 'Raj Patel', email: 'raj@salesportal.com', countryCode: 'IN' },
            { name: 'Anita Desai', email: 'anita@salesportal.com', countryCode: 'IN' },
            { name: 'Vikram Singh', email: 'vikram@salesportal.com', countryCode: 'IN' }
        ];

        for (const r of repData) {
            const manager = managers.find(m => m.countryCode === r.countryCode);
            const rep = await User.create({
                ...r,
                password: 'password123',
                role: 'rep',
                managerId: manager._id
            });
            reps.push(rep);
            console.log(`Created rep: ${rep.email} (${rep.countryCode})`);
        }

        // Create sample leads
        const statuses = ['open', 'pending_review', 'approved', 'denied', 'closed'];
        const leads = [];

        for (let i = 0; i < 30; i++) {
            const rep = reps[i % reps.length];
            const manager = managers.find(m => m.countryCode === rep.countryCode);
            const status = statuses[i % statuses.length];
            const title = LEAD_TITLES[i % LEAD_TITLES.length];
            const company = COMPANIES[i % COMPANIES.length];

            const daysAgo = Math.floor(Math.random() * 60);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            const leadData = {
                title: `${title} — ${company}`,
                description: `Potential ${title.toLowerCase()} opportunity with ${company}. Initial contact established via LinkedIn. Decision maker identified. Budget range: $${(Math.random() * 500 + 50).toFixed(0)}K. Timeline: Q${Math.ceil(Math.random() * 4)} 2026.\n\nKey stakeholders:\n- CTO (primary contact)\n- VP Engineering\n- Procurement Lead\n\nNext steps: Schedule technical deep-dive demo and prepare proposal.`,
                companyName: company,
                contactEmail: `contact@${company.toLowerCase().replace(/\s+/g, '')}.com`,
                estimatedValue: Math.floor(Math.random() * 500000 + 50000),
                countryCode: rep.countryCode,
                tags: [TAGS[i % TAGS.length], TAGS[(i + 3) % TAGS.length]],
                status,
                createdBy: rep._id,
                createdAt
            };

            // Add review data for reviewed leads
            if (status === 'approved' || status === 'denied') {
                leadData.reviewedBy = manager._id;
                leadData.reviewComment = status === 'approved'
                    ? 'Looks promising. Great work on the initial contact. Proceed with proposal.'
                    : 'Value doesn\'t meet our threshold for this quarter. Re-evaluate next quarter.';
                leadData.reviewedAt = new Date(createdAt.getTime() + 86400000 * 2);
                leadData.comments = [
                    {
                        user: rep._id,
                        body: 'Submitted for review. The client is very interested and has budget allocated.',
                        createdAt: new Date(createdAt.getTime() + 86400000)
                    },
                    {
                        user: manager._id,
                        body: status === 'approved'
                            ? `**✅ Approved**: ${leadData.reviewComment}`
                            : `**❌ Denied**: ${leadData.reviewComment}`,
                        createdAt: leadData.reviewedAt
                    }
                ];
            } else if (status === 'pending_review') {
                leadData.comments = [
                    {
                        user: rep._id,
                        body: 'Ready for review. All details are up to date.',
                        createdAt: new Date(createdAt.getTime() + 86400000)
                    }
                ];
            }

            const lead = await Lead.create(leadData);
            leads.push(lead);
        }

        console.log(`\nCreated ${leads.length} sample leads`);

        // Create audit logs for some actions
        const auditActions = [
            { userId: master._id, action: 'user_login', targetType: 'user', targetId: master._id },
            { userId: managers[0]._id, action: 'lead_approved', targetType: 'lead', targetId: leads[2]._id, details: { title: leads[2].title } },
            { userId: managers[1]._id, action: 'lead_denied', targetType: 'lead', targetId: leads[3]._id, details: { title: leads[3].title } },
            { userId: reps[0]._id, action: 'lead_created', targetType: 'lead', targetId: leads[0]._id, details: { title: leads[0].title } },
            { userId: master._id, action: 'role_changed', targetType: 'user', targetId: managers[0]._id, details: { from: 'rep', to: 'manager' } }
        ];

        for (const a of auditActions) {
            await AuditLog.create(a);
        }
        console.log('Created audit logs');

        console.log('\n========================================');
        console.log('🌱 SEED COMPLETE — Demo Credentials:');
        console.log('========================================');
        console.log('Master:  master@salesportal.com / password123');
        console.log('Manager: kodi@salesportal.com   / password123 (US)');
        console.log('Manager: wei@salesportal.com    / password123 (CN)');
        console.log('Manager: priya@salesportal.com  / password123 (IN)');
        console.log('Rep:     sarah@salesportal.com  / password123 (US)');
        console.log('Rep:     raj@salesportal.com    / password123 (IN)');
        console.log('========================================');
        console.log('All passwords: password123');

        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
