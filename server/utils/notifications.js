const Notification = require('../models/Notification');
const User = require('../models/User'); // Import User
const { sendEmail } = require('./email');

const createNotification = async (req, { users, type, message, link }) => {
    try {
        const notifications = users.map(userId => ({
            user: userId,
            type,
            message,
            link,
            read: false,
            createdAt: new Date()
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);

            // Emit socket events and Send Emails
            const userDetails = await User.find({ _id: { $in: users } });

            users.forEach(userId => {
                req.io.to(userId.toString()).emit('notification', {
                    type,
                    message,
                    link
                });
            });

            // Send emails asynchronously
            userDetails.forEach(user => {
                if (user.email) {
                    sendEmail({
                        to: user.email,
                        subject: `Sales Portal Notification: ${type.toUpperCase()}`,
                        text: `${message}\n\nView details: http://localhost:5173${link}` // Assumption for MVP
                    });
                }
            });
        }
    } catch (err) {
        console.error('Notification Error:', err);
    }
};

module.exports = { createNotification };
