# Authentication API

Base URL for local development:

```text
http://localhost:3000
```

## Login

```http
POST /auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "player@example.com",
  "password": "password"
}
```

Successful credentials return HTTP `200`:

```json
{
  "result": "login_success"
}
```

Incorrect credentials also return HTTP `200`:

```json
{
  "result": "login_failed"
}
```

The frontend should keep the submitted email after `login_success`. It will use
that email to request the player's dashboard.

If the login service or database is unavailable, the API returns HTTP `500`:

```json
{
  "statusCode": 500,
  "message": "Login is unavailable right now"
}
```
