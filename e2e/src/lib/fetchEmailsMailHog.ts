import axios from 'axios';
import { appEnv } from './app-env';
import { EmailResponse } from '../interface/fetchEmailResponseInterface';

export async function fetchEmailsMailHog(emailSubject: string) {
  const mailResponseAxios = await axios.get(
    `${appEnv.MAILHOG_API_ROOT}/api/v2/search?kind=containing&query=${emailSubject}&limit=1`,
  );
  const mailResponse: EmailResponse = mailResponseAxios.data;
  if (mailResponse.items[0].Content.Headers.Subject[0] === emailSubject) {
    const body = mailResponse.items[0].Content.Body;
    const regex = /href=3D"([^"]+)"/;
    const matchURL = body.match(regex);
    if (matchURL) {
      return matchURL[1];
    }
  }
}
