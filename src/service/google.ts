
import { type ChatSession, GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const activeChats = new Map();

// Prompts iniciais para enviar para a Gemini, coleta o GEMINI_PROMPT do .env 
const history = [
    {
      role: 'user',
      parts: process.env.GEMINI_PROMPT ?? 'oi',
    },
    {
      role: 'model',
      parts: 'Olá, certo!',
    },
  ];
// Iniciar sessão de chat única com o historico inicial definido como o history acima, que tem o valor do prompt.
let chatSession = model.startChat({
  history,
});

// A função coleta os valores de currentMessage que no caso seriam as mensagens dos chats e envia para a Gemini.
export const mainGoogle = async ({
  currentMessage,
}: {
  currentMessage: string;
}): Promise<string> => {
  // Define a mensagem atual como prompt.
  const prompt = currentMessage;
  // Envia a mensagem para a sessão de chat única e espera pela resposta.
  const result = await chatSession.sendMessage(prompt);
  const response = await result.response;
  const text = await response.text();

  // Inicia a sessão com o modelo de gemini-pro e o historico de chat definido como o historico inicial.
  // chatSession = model.startChat({
  //   history,
  // });

  console.log("CHATHISTORY HERE: ",history)
  // Retorna o texto da resposta recebida da API.
  return text;
};
