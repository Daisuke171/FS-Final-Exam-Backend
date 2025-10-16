---
```graphql
mutation AcceptFriendInvite {
    acceptFriendInvite(
        input: {
            receiverId: "cb4399f9-e652-446e-b726-dfdcbb41792d"
            token: "2LY4jqBGi6wKH1d30WvVt3kqh7JL6vScCQYZtXMcSCU"
        }
    ) {
        id
        requesterId
        receiverId
        status
        createdAt
    }
}

```
---