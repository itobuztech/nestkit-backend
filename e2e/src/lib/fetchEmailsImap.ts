import { readEmails } from './imap-client';
import { format } from 'date-fns';

export async function fetchEmailsImap(emailSubject: string) {
  try {
    console.log('hello 1');
    let invitationLink: string;
    const messages = await readEmails({
      searchDate: format(new Date(), 'MMMM dd, yyyy'),
    });
    for (let index = 0; index < messages.length; index++) {
      const body = messages[index].body;

      const match = body.match(/<title>(.*?)<\/title>/);
      if (match) {
        if (emailSubject.includes(match[1]) && index === 0) {
          const regex = /href=3D"([^"]+)"/;
          const matchURL = body.match(regex);

          if (matchURL) {
            invitationLink = matchURL[1];
            console.log(invitationLink);
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
