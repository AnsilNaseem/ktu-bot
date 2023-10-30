import { Markup, Scenes } from "telegraf";
import { CustomContext } from "../types/customContext.type";
import fetchAnnouncements from "../services/fetchAnnouncements";
import fetchAttachment from "../services/fetchAttachment";
import { Attachment } from "../types/types";
import deleteMessage from "../utils/deleteMessage";
import handleError from "../utils/handleError";

const handleCancelCommand = async (ctx: CustomContext) => {
  await deleteMessage(ctx, ctx.scene.session.waitingMsgId);
  await deleteMessage(ctx, ctx.scene.session.announcementMsgId);
  await ctx.reply(
    "Notifications look up cancelled.\n\nPlease use /notifications to start again.",
  );
  return await ctx.scene.leave();
};

const announcementWizard = new Scenes.WizardScene<CustomContext>(
  "announcement-wizard",
  async (ctx: CustomContext) => {
    try {
      ctx.scene.session.pageNumber = 0;
      await showAnnouncements(ctx);
      return ctx.wizard.next();
    } catch (error: any) {
      return await handleError(ctx, error);
    }
  },
  async (ctx) => {
    if (ctx.message) {
      return await ctx.reply(
        "Please use the buttons to choose a notification.\n\nUse /cancel to cancel notifcations lookup.",
      );
    }
    try {
      const chosenAnnoucement = Number.parseInt(
        (ctx.callbackQuery as any)?.data?.split("_")[1],
      );
      const attachments = ctx.scene.session.announcements
        .find((announcement: any) => announcement.id == chosenAnnoucement)
        .attachments.map((attachment: any) => ({
          name: attachment.name,
          encryptId: attachment.encryptId,
        }));
      await ctx.deleteMessage(ctx.scene.session.announcementMsgId);
      const waitingMsg = await ctx.reply(
        "Fetching notification.. Please wait..",
      );
      ctx.scene.session.waitingMsgId = waitingMsg.message_id;

      attachments.forEach(async (attachment: Attachment) => {
        const file = await fetchAttachment(attachment.encryptId);
        const fileBuffer = Buffer.from(file, "base64");
        await ctx.replyWithDocument({
          source: fileBuffer,
          filename: attachment.name,
        });
      });
      return await ctx.scene.leave();
    } catch (error) {
      return await handleError(ctx, error);
    }
  },
);

async function showAnnouncements(ctx: CustomContext) {
  try {
    const waitingMsg = await ctx.reply(
      "Fetching notifications.. Please wait..",
    );
    ctx.scene.session.waitingMsgId = waitingMsg.message_id;
    const announcements = await fetchAnnouncements(
      ctx.scene.session.pageNumber,
      10,
    );
    const announcementButtons = announcements.map(({ id, subject }: any) => ({
      text: subject,
      callback_data: `announcement_${id}`,
    }));
    const nextPageButton = Markup.button.callback("Next Page", "next_page");
    const keyboard = Markup.inlineKeyboard(
      [...announcementButtons, nextPageButton],
      {
        columns: 1,
      },
    );
    await deleteMessage(ctx, ctx.scene.session.waitingMsgId);
    const msg = await ctx.sendMessage("Choose a notification:", keyboard);
    ctx.scene.session.announcementMsgId = msg.message_id;
    ctx.scene.session.announcements = announcements;
  } catch (error) {
    await handleError(ctx, error);
  }
}

announcementWizard.action("next_page", async (ctx) => {
  ctx.scene.session.pageNumber++;
  await ctx.deleteMessage(ctx.scene.session.announcementMsgId);
  await showAnnouncements(ctx);
  return await ctx.answerCbQuery();
});

announcementWizard.command("cancel", (ctx) => handleCancelCommand(ctx));

export default announcementWizard;