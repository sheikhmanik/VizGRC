import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  to: string,
  name: string,
  inviteLink: string
) => {
  try {
    const response = await resend.emails.send({
      from: "VizGRC <onboarding@resend.dev>",
      to,
      subject: "You're Invited to VizGRC",
      html: `
        <h2>Hello ${name},</h2>
        <p>You have been invited to join VizGRC.</p>
        <p>Click below to activate your account:</p>
        <a href="${inviteLink}" 
           style="padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
           Accept Invitation
        </a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
    console.log(response);
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    throw new Error("Failed to send email");
  }
};