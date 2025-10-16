---
Enviar un mensaje
---
```graphql
mutation SendMessage {
    sendMessage(
        input: {
            chatId: "1b5a03d8-ccd2-456d-8a73-a75e103da1c6"
            senderId: "b29b76fc-25c3-49b6-bf98-7b85b1e5cb77"
            message: "Holis"
        }
    ) {
        chatId
        message
        read
        senderId
        status
        timestamp
        id
    }
}
```
---
Ver los mensajes de un chat
```graphql
query Messages {
    messages(chatId: "1b5a03d8-ccd2-456d-8a73-a75e103da1c6") {
        chatId
        id
        message
        read
        senderId
        status
        timestamp
    }
}
```
---
Marcar un mensaje como leído
```graphql
mutation MarkMessageRead {
    markMessageRead(
        chatId: "1b5a03d8-ccd2-456d-8a73-a75e103da1c6"
        messageId: "2c84b42b-0cf9-4d03-a539-37b2c8f94942"
    ) {
        chatId
        id
        message
        read
        senderId
        status
        timestamp
    }
}
```
---