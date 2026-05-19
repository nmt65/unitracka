import { Document, University, User, initDb, sequelize } from "../models/index.js";
import { isSmtpConfigured, sendMailSafe } from "../services/mail.js";
import { daysUntil } from "../utils/dates.js";

async function main() {
  await initDb();
  if (!isSmtpConfigured()) {
    console.log("SMTP nu este configurat. Scriptul de reminders s-a oprit fara trimitere.");
    await sequelize.close();
    return;
  }

  const users = await User.findAll({ where: { emailNotifications: true }, include: [{ model: University, include: [Document] }] });
  for (const user of users) {
    const urgent = user.Universities.filter((uni) => {
      const days = daysUntil(uni.deadline);
      return days === user.notifyBeforeDays || days === 3;
    });
    if (!urgent.length) continue;

    await sendMailSafe({
      to: user.email,
      subject: "Reminder UniTrack: deadline-uri apropiate",
      text: urgent.map((uni) => `${uni.name} - ${uni.program}: ${uni.deadline}`).join("\n")
    });
    console.log(`Reminder trimis catre ${user.email}`);
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
