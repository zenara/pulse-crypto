# Error Handling Strategy

## Principles

Errors should be:

- Detected
- Classified
- Logged appropriately
- Recovered where possible
- Communicated to the user when relevant

---

# Binance Connection Failure

When Binance disconnects:

```text
Binance disconnected
       ↓
retry with exponential backoff
       ↓
reconnect
```

The backend should continue serving connected mobile clients where possible.

Existing market state may remain available until new data arrives.

---

# Mobile WebSocket Failure

When the mobile WebSocket disconnects:

```text
connected
   ↓
disconnected
   ↓
reconnecting
```

The last known market state remains visible.

The application should not clear the market store.

---

# REST Failure

If:

```http
GET /pairs/meta
```

fails during pull-to-refresh:

- Keep existing metadata.
- End the refresh state.
- Display an appropriate error/message.
- Do not interrupt the WebSocket connection.

---

# Malformed Messages

External data should not be trusted blindly.

Malformed Binance messages should:

- Be rejected or safely ignored.
- Be logged with enough context for debugging.
- Not crash the entire feed processor.

Malformed client WebSocket messages must not crash the gateway.

---

# Timers and Resources

All:

- WebSocket listeners
- timers
- intervals
- reconnect handlers

must be cleaned up.

This is particularly important for:

- backend shutdown
- mobile screen lifecycle
- reconnect logic

---

# Logging

Do not log every market update.

High-frequency logs can themselves become a performance problem.

Prefer lifecycle and error logs:

```text
Binance connected
Binance disconnected
Binance reconnecting
Mobile client connected
Mobile client disconnected
Processing error
```
