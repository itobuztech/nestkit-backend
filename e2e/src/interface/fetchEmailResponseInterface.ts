interface From {
  Relays?: any;
  Mailbox: string;
  Domain: string;
  Params: string;
}
interface Headers {
  'Content-Transfer-Encoding': string[];
  'Content-Type': string[];
  Date: string[];
  From: string[];
  'MIME-Version': string[];
  'Message-ID': string[];
  Received: string[];
  'Return-Path': string[];
  Subject: string[];
  To: string[];
}
interface Content {
  Headers: Headers;
  Body: string;
  Size: number;
  MIME?: any;
}
interface Raw {
  From: string;
  To: string[];
  Data: string;
  Helo: string;
}
interface Item {
  ID: string;
  From: From;
  To: From[];
  Content: Content;
  Created: string;
  MIME?: any;
  Raw: Raw;
}
export interface EmailResponse {
  total: number;
  count: number;
  start: number;
  items: Item[];
}
