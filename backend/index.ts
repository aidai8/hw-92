import express from "express";
import expressWs from "express-ws";
import cors from "cors";
import WebSocket from "ws";
import usersRouter from "./routers/users";
import config from "./config";
import mongoose from "mongoose";
import {ChatMessage, ChatMessageDocument} from "./models/ChatMessage";
import jwt, {JwtPayload} from "jsonwebtoken";
import User, {JWT_SECRET} from "./models/User";

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
const onlineUsers = new Map<string, WebSocket>();

interface IncomingMessage {
   type: string;
   payload: string;
}


const showOnlineUsers = () => {
   const usersList = Array.from(onlineUsers.keys());
   connectedClient.forEach(client => {
      client.send(JSON.stringify({
         type: "ONLINE_USERS",
         payload: usersList
      }));
   });
};

const showNewMessage = (message: ChatMessageDocument) => {
   connectedClient.forEach(client => {
      client.send(JSON.stringify({
         type: "NEW_MESSAGE",
         payload: {
            username: message.username,
            text: message.text
         }
      }));
   });
};

router.ws('/chat', async (ws, req) => {
   const token = req.query.token as string;

   try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {_id: string};
      const user = await User.findById(decoded._id);
      if (!user) throw new Error("User not found");

      const username = user.username;
      onlineUsers.set(username, ws);
      connectedClient.push(ws);
      showOnlineUsers();

      const messages = await ChatMessage.find().sort({createdAt: -1}).limit(30);
      ws.send(JSON.stringify({
         type: "INIT_MESSAGES",
         payload: messages.reverse()
      }));

      ws.on('message', async (msg) => {
         const decodedMsg = JSON.parse(msg.toString()) as IncomingMessage;
         if (decodedMsg.type === "SEND_MESSAGE") {
            const newMessage = new ChatMessage({
               username,
               text: decodedMsg.payload
            });
            await newMessage.save();
            showNewMessage(newMessage);
         }
      });

      ws.on('close', () => {
         onlineUsers.delete(username);
         const index = connectedClient.indexOf(ws);
         if (index !== -1) connectedClient.splice(index, 1);
         showOnlineUsers();
      });

   } catch (err) {
      ws.close(1008, err instanceof Error ? err.message : "Auth error");
   }
});

app.use(router);
run().catch(console.error);