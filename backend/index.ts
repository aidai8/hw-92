import express from "express";
import expressWs from "express-ws";
import cors from "cors";
import WebSocket from "ws";
import usersRouter from "./routers/users";
import config from "./config";
import mongoose from "mongoose";

const app = express();
const wsInstance = expressWs(app);

const port = 8000;
app.use(cors());
app.use(express.json());
app.use('/users', usersRouter);

const run = async () => {
   await mongoose.connect(config.db);

   app.listen(port, () => {
      console.log(`Server started on http://localhost:${port}`);
   });

   process.on('exit', () => {
      mongoose.disconnect();
   });
};

const router = express.Router();
wsInstance.applyTo(router);

const connectedClient: WebSocket[] = [];

interface IncomingMessage {
   type: string;
   payload: string;
}

router.ws('/chat', (ws, req) => {
   console.log('Client connected');
   let username = 'Anonymous';

   connectedClient.push(ws);
   console.log('Total connections: ' + connectedClient.length);

   ws.on('message', (message) => {
      try {
         const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;
         console.log(decodedMessage);

         if (decodedMessage.type === "SEND_MESSAGE") {
            connectedClient.forEach((clientWS) => {
               clientWS.send(JSON.stringify({
                  type: "NEW_MESSAGE",
                  payload: {username: username, text: decodedMessage.payload}
               }));
            });
         } else if (decodedMessage.type === "SET_USERNAME") {
            username = decodedMessage.payload;
         }

      } catch (e) {
         ws.send(JSON.stringify({error: 'Invalid message'}));
      }
   });

   ws.on('close', () => {
      console.log('Client disconnected');
      const index = connectedClient.indexOf(ws);
      connectedClient.splice(index, 1);
      console.log('Total connections: ' + connectedClient.length);
   });
});

app.use(router);
run().catch(console.error);