const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email sending route with reCAPTCHA verification
app.post('/api/send-email', async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;

  // Validate input
  if (!name || !email || !message || !recaptchaToken) {
    return res.status(400).json({ message: 'All fields and reCAPTCHA are required.' });
  }

  // Verify reCAPTCHA
  try {
    const recaptchaResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        }
      }
    );

    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return res.status(500).json({ message: 'Error verifying reCAPTCHA.' });
  }

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'felixidowu48@gmail.com',
    subject: `New Contact Form Submission from ${name}`,
    text: `
      Name: ${name}
      Email: ${email}
      Message: ${message}
    `,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});