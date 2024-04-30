import wppconnect from '@wppconnect-team/wppconnect';
import dotenv from 'dotenv';
import { initializeNewAIChatSession, mainOpenAI } from './service/openai';
import { splitMessages, sendMessagesWithDelay } from './util';
import { mainGoogle } from './service/google';

dotenv.config();
type AIOption = 'GPT' | 'GEMINI';

const messageBufferPerChatId = new Map();
const messageTimeouts = new Map();
const AI_SELECTED: AIOption = (process.env.AI_SELECTED as AIOption) || 'GEMINI';
const chatIdsToReport = new Set();

if (AI_SELECTED === 'GEMINI' && !process.env.GEMINI_KEY) {
  throw Error(
    'Você precisa colocar uma key do Gemini no .env! Crie uma gratuitamente em https://aistudio.google.com/app/apikey?hl=pt-br'
  );
}

if (
  AI_SELECTED === 'GPT' &&
  (!process.env.OPENAI_KEY || !process.env.OPENAI_ASSISTANT)
) {
  throw Error(
    'Para utilizar o GPT você precisa colocar no .env a sua key da openai e o id do seu assistante.'
  );
}

// Inicia a sessão para logar com QR code no zap
wppconnect
  .create({
    session: 'sessionName',
    catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
      console.log('Terminal qrcode: ', asciiQR);
    },
    statusFind: (statusSession, session) => {
      console.log('Status Session: ', statusSession);
      console.log('Session name: ', session);
    },
    headless: 'new' as any,
  })
  .then((client) => {
    start(client);
  })
  .catch((erro) => {
    console.log(erro);
  });

// FUNÇÃO PARA FORMATAR TIMESTAMP PARA DATA dd-MM-yyyy
function timeToDate(timestamp : number) {
  var date = new Date(timestamp * 1000);
  var day = date.getDate();
  var m = date.getMonth() + 1;
  var y = date.getFullYear();

  return `${day}-${m}-${y}`
}

var teste = ""


// FUNÇÃO ASSÍNCRONA PARA PEGAR AS MENSAGENS E OUTROS DADOS DO WPP
async function start(client: wppconnect.Whatsapp): Promise<void> {

  let grupoId = "";
  
  client.onMessage((message) => {
    (async () => {

    if(message.isGroupMsg && message.chatId !== 'status@broadcast' && message.body === "Configurar reportz" ) {
      grupoId = message.chatId;
      client.sendText(message.chatId, "Configurado com sucesso para o grupo: " + message.chatId)


    } 

    // Verifica se a mensagem é de um chat individual (não de grupo) e não é uma mensagem de status e contém "Relate"
    if(message.type === 'chat' && message.chatId !== 'status@broadcast' && message.body === "Relate" && grupoId.length > 1) {
      // Pega a os últimos chats que mandaram mensagem, limitado ao valor de count
      
      //Grupo 1120363281185762281@g.us
      //Grupo 2 120363268332306647@g.us
      const maxChats = await client.listChats({count: 5});

      console.log("Gerando dados para relatório...", message.type, message.chatId, message.body)

  
      //Coleta todos os IDs das conversas q a ultima mensagem foram no dia de hoje. Convertando o timestamp para dd-MM-yyyy comparando com o new Date de hoje

      // Data de hoje
      const today = `${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`

      let IdsToday: string[] = [];
      
      // Coleta os chat Ids que tiveram uma mensagem enviada pela última vez hoje e armazena em IdsToday
      maxChats.forEach(objeto => {
        // console.log("OBJETO: ", objeto)
        if(objeto.isGroup === false && timeToDate(objeto.t) === today) {                     
          
          IdsToday.push(objeto.id.user ) 
          
          // console.log("IdsToday AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: ", timeToDate(objeto.t), "É VERDADE PORRA? ", timeToDate(objeto.t) === today) 
        }else{
          // console.log("GRUPO: ", objeto)
        }
      });
      

      // Para cada IdsToday, que é um array de Ids do dia de hoje, chama a função mensagensPo
      IdsToday.forEach(ids => {
        teste += mensagensPo(ids)

      })

    }
    else{
      console.log("GKW: ", message.type, message.chatId, message.body, grupoId, grupoId.length > 1)
    }

  })();
});

  
  // A função armazena as mensagens de cada Id do IdsToday em b e depois coleta essas mensagens em currentMessage
  async function mensagensPo(test: string){
    var currentMessage = ""
    const b = await client.getMessages(test)
    const hoje  = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`

    // console.log("TEST: ", test)



    b.map(items => {

        currentMessage += items.type === "e2e_notification" ? "" : ` Nome: ${items.sender.pushname ? items.sender.pushname : items.sender.isMe ? "Atendente" : items.sender.verifiedName ? items.sender.verifiedName : "não definido" } / Remetente: ${items.sender.isMe ? "Atendente" : 'Cliente'} / Mensagem: ${items.type === "ptt" ? "Mensagem de audio" : items.type === "sticker" ? "Mensagem de figurinha" : items.type === "image" ? "Mensagem de imagem" : items.type === "video" ?  "Mensagem de video" : items.type === "document" ? "Mensagem de documento" : items.type === "chat" ? items.content : items.type === "vcard" ? "Mensagem de contato do whatsApp" :"Mensagem indefinida"} / Horário: ${new Date(items.timestamp * 1000).getHours()}:${new Date(items.timestamp * 1000).getMinutes()}:${new Date(items.timestamp * 1000).getSeconds() }  / Tipo de mensagem: ${items.type} /  Data da mensagem: ${new Date(items.timestamp * 1000).getDate()}/${new Date(items.timestamp * 1000).getMonth() + 1}/${new Date(items.timestamp * 1000).getFullYear()}} 
        \n`
      })

    console.log("currentMessageEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE: ", currentMessage) 
    const chatId = ""

    const answer = AI_SELECTED === 'GPT'
    ? "" : await mainGoogle({ currentMessage });

    const messages = splitMessages(answer)

    await sendMessagesWithDelay({
      client,
      messages,
      targetNumber: grupoId,
    });
  }
}



