---
```graphql
mutation UpdateFriendStatus {
    updateFriendStatus(
        input: { id: "b29b76fc-25c3-49b6-bf98-7b85b1e5cb77", status: ACCEPTED }
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