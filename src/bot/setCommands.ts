import bot from "@/bot";
import availableCommands from "@constants/availableCommands";

// Set the available commands for the bot
function setCommands() {
  bot.telegram.setMyCommands(availableCommands);
}

export default setCommands;
