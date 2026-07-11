---
layout: chapter
title: "Cluster-lang: Chapter 10 — Custom Frontend & Backend File Extensions"
permalink: /chapter10/
prev_chapter: /chapter9/
prev_title: "Chapter 9"
next_chapter: /chapter11/
next_title: "Chapter 11"
---

# Cluster-lang: Chapter 10 — Custom Frontend & Backend File Extensions

This chapter introduces the custom compiler extensions that optimize frontend templates, static configurations, and database queries into high-speed native C++.

---

## 1. `.clcfg` (Cluster Static Configurations)

The `.clcfg` extension allows writing app configurations in a clean key-value format. The compiler transpiles these configs into C++ compile-time `constexpr` variables, eliminating runtime config parsing and startup delays.

### Configuration File (`config.clcfg`)
```ini
app_name = "Cluster App"
port = 8080
debug = true
rate_limit = 1.5
```

### Usage in Code (`main.cl`)
```python
import "config.clcfg" as config

fn main():
    put config.app_name
    put config.port
```

---

## 2. `.clx` (Cluster UI Templates)

The `.clx` extension supports writing HTML/XML-like UI components with embedded control flows. They transpile to native C++ string-builder operations, making server-side HTML rendering (SSR) hundreds of times faster than Node.js.

### UI Component File (`TodoItem.clx`)
```html
<component name="TodoItem" item: string, done: bool>
    <div class="item">
        <span>{item}</span>
        {if done}
            <span class="badge">Completed</span>
        {else}
            <span class="badge">Pending</span>
        {end}
    </div>
</component>
```

### Usage in Code (`main.cl`)
```python
import "TodoItem.clx" as ui

fn main():
    html := ui.TodoItem("Write C++ compiler", true)
    put html
```

---

## 3. `.clq` (Cluster Pre-compiled Queries)

The `.clq` extension allows writing database queries mapped to functions. The compiler transpiles these into pre-prepared database bindings, eliminating runtime SQL parsing latency.

### Database Query File (`queries.clq`)
```sql
database: "app.db"

query get_user_by_id(id: int):
    SELECT id, name, email FROM users WHERE id = ?1;
```

### Usage in Code (`main.cl`)
```python
import "queries.clq" as q

fn main():
    // Fetch users with id 42
    results := q.get_user_by_id(42)
    put len(results)
```
Note: If the C++ compilation environment lacks SQLite libraries, the compiler automatically falls back to safe mock modes returning empty collections without throwing runtime crashes.

---

## 4. `.clp` (Cluster Pattern Parser)

The `.clp` extension enables declaring pattern parsers for structured logs, CSVs, or key-value data. The compiler transpiles these pattern rules into optimized, zero-dependency C++ parsing models.

### Parser Definition File (`UserCSV.clp`)
```text
parser UserCSV:
    format: "{id:int},{name:string},{email:string}"
```

### Usage in Code (`main.cl`)
```python
import "UserCSV.clp" as parser

fn main():
    csv_line := "101,Bob,bob@example.com"
    user := parser::parse_UserCSV(csv_line)
    
    put user.id      // Prints 101
    put user.name    // Prints Bob
    put user.email   // Prints bob@example.com
```
