const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create a test account if no real SMTP credentials
        let transporter;
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Use Ethereal for testing
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log(`[Email] Ethereal account created: ${testAccount.user}`);
        }

        const message = {
            from: `${process.env.FROM_NAME || 'Sales Portal'} <${process.env.FROM_EMAIL || 'noreply@salesportal.com'}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(message);

        console.log(`[Email] Message sent: ${info.messageId}`);
        if (!process.env.SMTP_HOST) {
            console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        console.error('[Email] Error:', err);
    }
};

module.exports = { sendEmail };
