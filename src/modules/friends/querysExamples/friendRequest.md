---
```graphql
mutation RequestFriendByUsername {
    requestFriendByUsername(
        input: {
            requesterId: "2abd0f55-2a3e-4e9c-836a-89bd6aff9555"
            username: "prueba_user"
        }
    ) {
        active
        createdAt
        id
        receiverId
        requesterId
        status
        updatedAt
    }
}
```
---