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
    if(message.type === 'chat' && message.chatId !== 'status@broadcast' && message.body === "Relate" && message.chatId === '120363281185762281@g.us') {
      // Pega a os últimos chats que mandaram mensagem, limitado ao valor de count
      const maxChats = await client.listChats({count: 3});
   
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

    if (message.type === 'chat' && !message.isGroupMsg && message.chatId !== 'status@broadcast' ) {
      console.log("CHATID AQ", message.chatId)

      // const chatId = message.chatId; // Extrai o identificador do chat (chatId) da mensagem

      // console.log('Ok!!! Mensagem recebida:', message.body); // Registra a mensagem recebida no console

  
      // // Se o modelo de IA selecionado for o GPT, inicializa uma nova sessão de chat com a IA
      // if (AI_SELECTED === 'GPT') {
      //   await initializeNewAIChatSession(chatId);
      // }

      // // Verifica se já existe um buffer de mensagens para o chatId atual
      // if (!messageBufferPerChatId.has(chatId)) {
      //   // Se não existir, cria um novo buffer de mensagens para o chatId
      //   messageBufferPerChatId.set(chatId, []);
      // }

      // // Adiciona a mensagem recebida ao buffer de mensagens para o chatId atual
      // messageBufferPerChatId.set(chatId, [...messageBufferPerChatId.get(chatId), message.body]);

      // // Remove qualquer timeout existente para o chatId atual
      // if (messageTimeouts.has(chatId)) {
      //   clearTimeout(messageTimeouts.get(chatId));
      // }

      // console.log('Aguardando novas mensagens...'); // Registra uma mensagem no console indicando que está aguardando novas mensagens

      // // Define um novo timeout de 10 segundos para o chatId atual
      // messageTimeouts.set(
      //   chatId,
      //   setTimeout(() => {
      //     (async () => {
      //       console.log('Gerando resposta para: ', [...messageBufferPerChatId.get(chatId)].join(' \n ')); // Registra as mensagens do buffer no console

      //       // Une todas as mensagens do buffer em uma única string separada por nova linha
      //       const currentMessage = [...messageBufferPerChatId.get(chatId)].join(' \n ');

      //       // Gera uma resposta usando o modelo de IA selecionado (GPT ou Google)
            // const answer = AI_SELECTED === 'GPT'
            //   ? await mainOpenAI({ currentMessage, chatId })
            //   : await mainGoogle({ currentMessage, chatId });

      //       // Divide a resposta em várias mensagens menores
      //       const messages = splitMessages(answer);

      //       console.log('Enviando mensagens...'); // Registra uma mensagem no console indicando que está enviando mensagens

      //       // Envia as mensagens divididas de volta para o remetente original com um atraso
            // await sendMessagesWithDelay({
            //   client,
            //   messages,
            //   targetNumber: message.from, // Número do remetente original
            //   timeMessage: message.timestamp, // Timestamp da mensagem original
            //   time: message.t, // Timestamp adicional da mensagem original
            // });

      //       // Remove o buffer de mensagens e o timeout para o chatId atual
      //       messageBufferPerChatId.delete(chatId);
      //       messageTimeouts.delete(chatId);
      //     })();
      //   }, 10000)
      // );
    }
    else{
      console.log(`Tipo: ${message.type} t: ${message.t} timestamp: ${message.timestamp} Time: ${new Date(message.timestamp * 1000 )}`)
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



