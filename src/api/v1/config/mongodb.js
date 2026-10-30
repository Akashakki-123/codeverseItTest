

import { connect } from "mongoose";
import dotenv from 'dotenv';
dotenv.config()


  const username = process.env.DBUSERNAME
const password = process.env.DBPASSWORD
const dateBaseName = process.env.DBNAME
const dateBaseLink = process.env.DBLINK
const connection = (username && password)
  ? `mongodb+srv://${username}:${password}@${dateBaseLink}/${dateBaseName}?retryWrites=true&w=majority`
  : (process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${dateBaseName}`);
export const db = () => {
    connect(connection)
  .then(() => console.log("Datebase Connected"))
  .catch((err) => console.log(err.message))


}