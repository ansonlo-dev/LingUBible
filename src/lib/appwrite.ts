import { Client, Account, Databases, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // 例如：'https://cloud.appwrite.io/v1'
    .setProject('lingubible'); // 您的 Appwrite 專案 ID

export const account = new Account(client);
export const databases = new Databases(client);

export { ID };
export default client; 