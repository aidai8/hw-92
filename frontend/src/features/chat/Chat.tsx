import React, {useEffect, useRef, useState} from "react";
import type {ChatMessage, IncomingMessage} from "../../types";
import {Box, Button, Card, CardContent, Container, Divider, List, ListItem, Paper, TextField, Typography, Avatar, Badge, Chip} from "@mui/material";
import Grid from '@mui/material/Grid2';
import {styled} from "@mui/material/styles";
import {useAppSelector} from "../../app/hooks.ts";
import {selectUser} from "../users/usersSlice.ts";

const MessageCard = styled(Card)(({theme}) => ({
    marginBottom: theme.spacing(1),
    maxWidth: "80%",
    alignSelf: "flex-start",
    "&.currentUser": {
        alignSelf: "flex-end",
        backgroundColor: theme.palette.success.light,
    },
}));

const OnlineUserBadge = styled(Badge)(({theme}) => ({
    "& .MuiBadge-badge": {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.main,
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    },
}));



const Chat = () => {
    const user = useAppSelector(selectUser);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    useEffect(() => {
        if (!user) return;
        const connect = () => {
            ws.current = new WebSocket(`ws://localhost:8000/chat?token=${user.token}`);

            ws.current.onmessage = (event) => {
                const decoded = JSON.parse(event.data) as IncomingMessage;
                switch (decoded.type) {
                    case "NEW_MESSAGE":
                        setMessages((prev) => [...prev, decoded.payload as ChatMessage]);
                        break;
                    case "ONLINE_USERS":
                        setOnlineUsers(decoded.payload as string[]);
                        break;
                    case "INIT_MESSAGES":
                        setMessages(decoded.payload as ChatMessage[]);
                        break;
                }
            };

            ws.current.onclose = () => setTimeout(connect, 3000);
        };

        connect();
        return () => {
            if (ws.current) ws.current.close();
        };
    }, [user]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !ws.current) return;

        ws.current.send(
            JSON.stringify({
                type: "SEND_MESSAGE",
                payload: messageInput,
            })
        );
        setMessageInput("");
    };

    return (
        <Container maxWidth="md" sx={{mt: 4}}>
            <Paper elevation={3} sx={{p: 2}}>
                <Box sx={{display: "flex", justifyContent: "space-between", mb: 2}}>
                    <Typography variant="h5" component="h1">
                        Online users:
                    </Typography>
                    <Box>
                        {onlineUsers.map((username) => (
                            <Chip
                                key={username}
                                label={username}
                                color="success"
                                size="small"
                                sx={{mr: 1}}
                                avatar={
                                    <OnlineUserBadge overlap="circular" variant="dot">
                                        <Avatar sx={{width: 24, height: 24}}>
                                            {username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </OnlineUserBadge>
                                }
                            />
                        ))}
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box
                    sx={{
                        height: "60vh",
                        overflowY: "auto",
                        mb: 2,
                        p: 1,
                        bgcolor: "background.default",
                        borderRadius: 1,
                    }}
                >
                    <List>
                        {messages.map((msg, index) => (
                            <ListItem
                                key={index}
                                sx={{justifyContent: msg.username === user?.username ? "flex-end" : "flex-start",}}
                            >
                                <MessageCard
                                    className={msg.username === user?.username ? "currentUser" : ""}
                                >
                                    <CardContent sx={{py: 1, px: 2}}>
                                        <Typography variant="caption" color="text.secondary">
                                            {msg.username}
                                        </Typography>
                                        <Typography variant="body1">{msg.text}</Typography>
                                    </CardContent>
                                </MessageCard>
                            </ListItem>
                        ))}
                        <div ref={messagesEndRef} />
                    </List>
                </Box>

                <Box component="form" onSubmit={sendMessage}>
                    <Grid container spacing={1}>
                        <Grid size={{xs: 10}}>
                            <TextField
                                fullWidth
                                size="small"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                            />
                        </Grid>
                        <Grid size={{xs: 2}}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                type="submit"
                                disabled={!messageInput.trim()}
                            >
                                Send
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default Chat;