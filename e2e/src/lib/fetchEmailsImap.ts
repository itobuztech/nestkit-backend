import { readEmails } from './imap-client';
import { format } from 'date-fns';

export async function fetchEmailsImap(emailSubject: string) {
  try {
    let invitationLink: string;
    const messages = await readEmails({
      searchDate: format(new Date(), 'MMMM dd, yyyy'),
    });
    for (let index = messages.length - 1; index > 0; index--) {
      const body = messages[index].body;
      const match = body.match(/<h1>(.*?)<\/h1>/);
      if (match) {
        if (match[1].includes(emailSubject) && index === messages.length - 1) {
          const regex = /href=3D"([^"]+)"/;
          const matchURL = body.match(regex);

          if (matchURL) {
            invitationLink = matchURL[1];
            return invitationLink;
          }
          break;
        }
      }
    }
  } catch (error) {
    console.log(error);
    return '';
  }
}
