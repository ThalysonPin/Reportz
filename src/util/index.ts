import { type Whatsapp } from '@wppconnect-team/wppconnect';
import { timeStamp } from 'console';


export function splitMessages(text: string): string[] {

  const pattern =
    /(?:http[s]?:\/\/[^\s]+)|(?:www\.[^\s]+)|[^?!]+(?:[?!]+["']?|$)/g;
  const matches = text.match(pattern);
  return matches ?? [];
}




export async function sendMessagesWithDelay({
  messages,
  client,
  targetNumber,
}: {
  messages: string[];
  client: Whatsapp;
  targetNumber: string;
}): Promise<void> {
  for (const [, msg] of messages.entries()) {
    const dynamicDelay = msg.length * 10;
    await new Promise((resolve) => setTimeout(resolve, dynamicDelay));
    client
      .sendText(targetNumber, msg.trimStart())
      .then((result) => {
        //console.log('Mensagem enviada nesse krl:', result.body);

      })
      .catch((erro) => {
        console.error('Erro ao enviar mensagem:', erro);
      });
  }
}
