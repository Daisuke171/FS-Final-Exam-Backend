---
```graphql
mutation CreateUser {
    createUser(
        data: {
            email: "test@test.com"
            nickname: "test"
            password: "Asd1234!"
            name: "test"
            lastname: "test"
            birthday: "1999-05-08T00:00:00Z" 
            levelId: 1,
            username: "yam_user"
        }
    ) {
        id
        email
        nickname
        name
        lastname
        birthday
        levelId
        createdAt
        updatedAt
    }
}
```
---
