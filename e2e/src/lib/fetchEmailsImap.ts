import { readEmails } from './imap-client';
import { format } from 'date-fns';

export async function fetchEmailsImap(emailSubject: string) {
  console.log('hello 1');
  try {
    let invitationLink: string;
    const messages = await readEmails({
      searchDate: format(new Date(), 'MMMM dd, yyyy'),
    });

    for (let index = messages.length - 1; index >= 0; index--) {
      const body = messages[index].body;
      if (body.includes(emailSubject) && index === messages.length - 1) {
        const regex = /href=3D"([^"]+)"/;
        const matchURL = body.match(regex);

        if (matchURL) {
          invitationLink = matchURL[1];
          return invitationLink;
        }
        break;
      }
    }
  } catch (error) {
    console.log(error);
    return '';
  }
}
