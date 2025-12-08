const nodemailer = require("nodemailer");

async function sendEmail(to, subject, html) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Musicfy" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log("Mail sent successfully!");

    } catch (error) {
        console.log("Email Send Error:", error);
        throw error;
    }
}

module.exports = sendEmail;
