import { CustomContext } from "../types/customContext.type";
const randomQuotes = require("random-quotes");

async function defaultHandler(ctx: CustomContext) {
  const quote = randomQuotes.default();
  const message = `<i>${quote.body}</i>\n
  - <i>${quote.author}</i>`;
  const invalidMsg =
    "That doesn't seem like a valid command.\n\nUse /help for available commands";

  await ctx
    .replyWithHTML(message, {
      reply_to_message_id: ctx.message!.message_id,
    })
    .then(({ message_id }) => {
      setTimeout(() => ctx.deleteMessage(message_id), 5000);
    })
    .then(() => {
      ctx.reply(invalidMsg);
    });
}

export default defaultHandler;