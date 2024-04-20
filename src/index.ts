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


// FUNÇÃO ASSÍNCRONA PARA PEGAR AS MENSAGENS E OUTROS DADOS DO WPP
async function start(client: wppconnect.Whatsapp): Promise<void> {
  
  client.onMessage((message) => {
    (async () => {

    // Verifica se a mensagem é de um chat individual (não de grupo) e não é uma mensagem de status e contém "Relate"
    if(message.type === 'chat' && message.chatId !== 'status@broadcast' && message.body === "Relate" && message.chatId === '120363268332306647@g.us') {
      // Pega a os últimos chats que mandaram mensagem, limitado ao valor de count

      //Grupo 1120363281185762281@g.us
      //Grupo 2 120363268332306647@g.us
      const maxChats = await client.listChats({count: 30});

      console.log("Gerando dados para relatório...", message.type, message.chatId, message.body)

   
      //Coleta todos os IDs das conversas q a ultima mensagem foram no dia de hoje. Convertando o timestamp para dd-MM-yyyy comparando com o new Date de hoje

      // Data de hoje
      const today = `${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`

      let IdsToday: string[] = [];
      
      // Coleta os chat Ids que tiveram uma mensagem enviada pela última vez hoje e armazena em IdsToday
      maxChats.forEach(objeto => {
        if(timeToDate(objeto.t) === today && !objeto.isGroup ) {                     
          IdsToday.push(objeto.id.user)    
        }else{

        }
      });

 
      IdsToday.forEach(ids => {
        mensagensPo(ids)
      })


    }
    else{
      console.log("GKW: ", message.type, message.chatId, message.content)

    }

  })();
});

  async function mensagensPo(test: string){
    var currentMessage = ""
    const b = await client.getMessages(test)
    // const c = b.map(items => items.timestamp)
    const hoje  = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`


    const c = b.map(items => {
      if(`${new Date(items.timestamp * 1000).getDate()}/${new Date(items.timestamp * 1000).getMonth() + 1}/${new Date(items.timestamp * 1000).getFullYear()}` === hoje){
        return items
      }
    })

    b.forEach(items => {
      if(`${new Date(items.timestamp * 1000).getDate()}/${new Date(items.timestamp * 1000).getMonth() + 1}/${new Date(items.timestamp * 1000).getFullYear()}` === hoje){
        
      currentMessage += ` Nome: ${items.sender.pushname ? items.sender.pushname : 'Não definido'} / Remetente: ${items.sender.formattedName === "Eu" ? "Atendente" : 'Cliente'} / Mensagem: ${items.content} / Horário: ${new Date(items.timestamp * 1000).getHours()}-${new Date(items.timestamp * 1000).getMinutes()}-${new Date(items.timestamp * 1000).getSeconds()} / Timestamp: ${items.timestamp * 1000} / Tipo de mensagem: ${items.type} /  Data da mensagem: ${new Date(items.timestamp * 1000).getDate()}/${new Date(items.timestamp * 1000).getMonth() + 1}/${new Date(items.timestamp * 1000).getFullYear()}} 
      \n`
      
      }
    })

    // Data: ${new Date(items.timestamp * 1000).getDate()}-${new Date(items.timestamp * 1000).getMonth() + 1}-${new Date(items.timestamp * 1000).getFullYear()} === ${today}

    // new Date(items.timestamp).getHours()}-${new Date(items.timestamp).getMinutes()}-${new Date(items.timestamp).getSeconds()


    
    const chatId = ""

    const answer = AI_SELECTED === 'GPT'
    ? "" : await mainGoogle({ currentMessage });

    const messages = splitMessages(answer)

    await sendMessagesWithDelay({
      client,
      messages,
    });
  }
}



