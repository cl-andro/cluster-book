---
layout: chapter
title: "Chapter 27: Static Binary File Patching & Rewriting"
permalink: /chapter27/
prev_chapter: /chapter26/
prev_title: "Chapter 26"
---

# Chapter 27: Static Binary File Patching & Rewriting

To customize and adapt pre-compiled legacy executables, update static configurations embedded within binary files, or run automated patch procedures on compiled artifacts, Cluster-lang provides built-in low-level file I/O streams that compile directly to raw C library primitives.

This chapter details:
1. **Low-level Binary File Stream Built-ins** (`file_open`, `file_seek`, `file_write_byte`, `file_close`).
2. **Static Byte Replacement** to overwrite instructions, metadata headers, or data segments directly on disk.

---

## 1. Low-level Binary File Built-ins

Cluster-lang provides four direct built-in primitives to navigate and modify binary files without loading the entire contents into memory. These map straight to standard POSIX `fopen`, `fseek`, `fwrite`, and `fclose` operations.

*   `file_open(path: string, mode: string) -> ptr`: Opens a file handle. Use `"r+b"` for read/write binary mode.
*   `file_seek(handle: ptr, offset: int)`: Moves the stream cursor to a specific byte position.
*   `file_write_byte(handle: ptr, byte_value: int)`: Writes a single byte (cast to an 8-bit integer) to the current cursor position.
*   `file_close(handle: ptr)`: Flushes changes and closes the file descriptor.

---

## 2. Practical Binary File Patching Example

The following program creates a dummy binary file, opens it in read/write binary mode, navigates to a specific offset, and rewrites its contents.

```python
fn patch_binary(file_path: string, offset: int, replacement_bytes: vector[int]) -> int:
    # Open the compiled binary file on disk in read/write binary mode
    f := file_open(file_path, "r+b")
    if f == 0:
        put "Error: Unable to open binary file."
        return -1
        
    # Seek to the target offset where modifications are required
    file_seek(f, offset)
    
    # Write each byte sequentially to overwrite the existing machine instructions
    i := 0
    sz := list_size(replacement_bytes)
    while i < sz:
        file_write_byte(f, replacement_bytes[i + 0])
        i += 1
        
    # Close the handle to flush changes
    file_close(f)
    put "Successfully patched " + file_path + " at offset " + to_text(offset)
    return 0

fn main():
    # 1. Create a dummy binary file containing a signature string
    file_write("app_signature.bin", "VER_1.0_PROD")
    
    # 2. Prepare patch bytes to update the version suffix from "1.0" to "2.5"
    patch_payload := vector[int]()
    list_push(patch_payload, 50)  # ASCII '2'
    list_push(patch_payload, 46)  # ASCII '.'
    list_push(patch_payload, 53)  # ASCII '5'
    
    # Offset of the version text starts at index 4 ("1.0")
    patch_binary("app_signature.bin", 4, patch_payload)
    
    # 3. Read and print the resulting patched output
    updated_signature := read_file("app_signature.bin")
    put "Updated signature: " + updated_signature
    # Output: Updated signature: VER_2.5_PROD
```

---

## 3. How to Compile and Run

To compile a binary patcher in Cluster-lang, compile normally via `zkc`:

```bash
zkc patcher.cl -o patcher.out
./patcher.out
```

This compiles your script down to high-performance C++ code utilizing raw file streams, making it capable of patching gigabyte-sized binary files at maximum hard-drive speeds.
