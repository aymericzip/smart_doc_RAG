import { t, type Dictionary } from "intlayer";

const chatbotContent = {
  key: "chatbot-modal",
  content: {
    button: {
      label: t({
        en: "Click to open the chatbot",
        "en-GB": "Click to open the chatbot",
        fr: "Cliquez pour ouvrir le chatbot",
        es: "Haga clic para abrir el chatbot",
        de: "Klicken Sie, um den Chatbot zu öffnen",
        ja: "チャットボットを開くにはクリックしてください",
        ko: "챗봇을 열려면 클릭하세요",
        zh: "点击打开聊天机器人",
        it: "Clicca per aprire il chatbot",
        pt: "Clique para abrir o chatbot",
        hi: "चैटबॉट को खोलने के लिए क्लिक करें",
        ar: "انقر لفتح الدردشة",
        ru: "Нажмите, чтобы открыть чат-бота",
      }),
    },
  },
} satisfies Dictionary;

export default chatbotContent;
