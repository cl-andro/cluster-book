---
layout: chapter
title: "Chapter 22: Production HTTP & HTTPS Web Stack"
permalink: /chapter22/
prev_chapter: /chapter21/
prev_title: "Chapter 21"
next_chapter: /chapter23/
next_title: "Chapter 23"
---

# Chapter 22: Production HTTP & HTTPS Web Stack

Cluster provides a highly concurrent, production-ready web stack right out of the standard library, built under the hood on the blazing-fast `cpp-httplib` library. This integration brings C++ bare-metal performance while retaining the Pythonic, highly readable syntax that Cluster developers expect. Whether you are building internal microservices or high-performance public-facing APIs, Cluster's web stack gives you complete control without boilerplate overhead.

---

## 1. Overview of the Web Stack

The Cluster standard library `http` module provides robust client and server components. On the server side, it embraces a minimalist, routing-focused design pattern similar to modern micro-frameworks. It handles connection pooling, threading, and socket management automatically while allowing you to focus squarely on request routing and application logic.

---

## 2. Server Class and Routing

The primary workhorse is the `http::HttpServer` class. You register endpoints by attaching lambdas or functions to route methods like `.get()` and `.post()`.

```python
server := http::HttpServer()

server.get("/status", fn(req: http::HttpRequest, res: http::HttpResponse):
    res.set_status(200)
    res.set_body("OK")
)

server.post("/submit", fn(req: http::HttpRequest, res: http::HttpResponse):
    # Handle submission
    res.set_status(201)
)
```

---

## 3. The HttpRequest Structure

The `http::HttpRequest` object gives you comprehensive access to the incoming client request. Key properties include:
- `method`: The HTTP verb used (GET, POST, etc.)
- `path`: The requested URL path
- `body`: The raw request payload (useful for JSON or form data)
- `headers`: A map of HTTP headers
- `params`: Query string parameters or route captures

---

## 4. The HttpResponse Structure

To formulate a response, you interact with the `http::HttpResponse` object. Rather than returning a value from your handler, you invoke state-mutating methods on the response object:
- `set_body(content: string)`: Assigns the response payload.
- `set_status(code: int)`: Sets the HTTP status code (e.g., 200, 404, 500).
- `set_header(key: string, value: string)`: Appends custom headers to the response, such as `Content-Type`.

---

## 5. Secure Servers (HTTPS/TLS)

For production deployment facing the public web, Cluster includes `http::HttpSecureServer`. It functions exactly identically to the standard server but requires paths to your TLS/SSL certificates upon initialization.

```python
# Provide cert file and private key file paths
secure_server := http::HttpSecureServer("cert.pem", "key.pem")
secure_server.get("/", fn(req: http::HttpRequest, res: http::HttpResponse):
    res.set_body("Secure connection established!")
)
secure_server.listen("0.0.0.0", 443)
```

---

## 6. HTTP Client Functions

Cluster isn't just for building servers; it makes external requests trivial with `http::get(url)` and `http::post(url, body)`. These synchronous functions immediately return the response body, making them ideal for scraping, webhook triggers, or service-to-service communication.

```python
html := http::get("https://example.com")
api_response := http::post("https://api.example.com/data", "{\"key\":\"value\"}")
```

---

## 7. Ecosystem Comparison

Cluster's standard library aims to provide the best balance of speed and usability.

| Feature | Cluster (`http`) | Python (Flask) | Node (Express) | Go (`net/http`) |
| --- | --- | --- | --- | --- |
| **Performance** | C++ compiled (Fast) | Interpreted (Slow) | JIT (Medium) | Compiled (Fast) |
| **Syntax** | Minimal / Pythonic | Decorator-heavy | Callback / Async | Structs & Interfaces |
| **Concurrency** | Native Multi-threading | GIL Constrained | Single-threaded | Goroutines |
| **Setup Boilerplate** | Very Low | Low | Low | Medium |

---

## 8. Complete Working Example

Below is a complete, executable example demonstrating how to spin up a non-blocking asynchronous web server and immediately consume its API using Cluster's built-in client.

```python
fn start_server(port: int):
    cpp_inject "std::thread([port]() { http::HttpServer server; server.get(\"/api/hello\", [](http::HttpRequest req, http::HttpResponse res) { res.set_status(200); res.set_body(\"{\\\"message\\\": \\\"Hello from Cluster!\\\"}\"); res.set_header(\"Content-Type\", \"application/json\"); }); server.listen(\"0.0.0.0\", port); }).detach();"

fn main():
    put "Starting server on port 8080..."
    start_server(8080)
    sleep_ms(500)
    response := http::get("http://localhost:8080/api/hello")
    put response
```
