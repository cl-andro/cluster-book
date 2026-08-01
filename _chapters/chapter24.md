---
layout: chapter
title: "Chapter 24: Cluster Containers (clc) & Declarative Sandboxing (.clc)"
permalink: /chapter24/
prev_chapter: /chapter23/
prev_title: "Chapter 23"
---

# Chapter 24: Cluster Containers (clc) & Declarative Sandboxing (.clc)

Cluster-lang provides built-in support for containerization and sandbox isolation. While advanced users can orchestrate sandboxes programmatically using the low-level `container` namespace, Cluster-lang introduces a specialized, ultra-lightweight declarative container configuration format: **`.clc` files**.

Compared to verbose, nested YAML configurations (like Docker Compose or GitHub Actions files), `.clc` is 50% smaller, much cleaner to read, and is compiled directly into a native binary by the toolchain.

---

## 1. Writing Declarative Sandboxes (`.clc`)

A `.clc` file defines a container sandbox declaratively without any procedural boilerplate. There are no manual directory skeleton mounts, no `defer` blocks, and no manual cleanups. The toolchain handles all mounts and teardowns automatically.

Here is a sample `.clc` file:

```yaml
# Sandbox configuration
name: test-runner
rootfs: /tmp/clc_sandbox
hostname: sandbox-guest
share_hardware: true

# Environment variables
env:
    STAGE=production
    DATABASE_URL=localhost:5432

# Commands to run in sequence
run:
    "echo Starting workflow..."
    "hostname"
    "env | grep STAGE"
```

To compile and run this sandbox, invoke it directly through the compiler:
```bash
cl run my_sandbox.clc
```

---

## 2. Under the Hood: Transparent Translation

When the compiler detects a `.clc` file, it translates it transparently into a high-performance Cluster script under the hood, compiles it to native C++, and executes it. 

The generated script maps the configuration keys to the built-in `container` standard library namespace:

```python
fn main():
    // Generated automatically from config keys
    c := container::create("test-runner", "/tmp/clc_sandbox", "sandbox-guest")
    c.provision_skeleton()
    
    // Automatically bind-mounts essential host binaries read-only
    c.bind_mount("/bin", "/bin", true)
    c.bind_mount("/lib", "/lib", true)
    c.bind_mount("/lib64", "/lib64", true)
    c.bind_mount("/usr", "/usr", true)
    c.mount_proc()
    
    // Automatically shares device nodes for GPU/CUDA if share_hardware is true
    c.share_hardware()
    
    // Injects environment variables
    cpp_inject "setenv(\"STAGE\", \"production\", 1);"
    cpp_inject "setenv(\"DATABASE_URL\", \"localhost:5432\", 1);"
    
    // Runs commands sequentially
    c.run("echo Starting workflow...")
    c.run("hostname")
    c.run("env | grep STAGE")
    
    // Guarantees clean lazy unmounting and directory deletion
    c.cleanup()
```

---

## 3. Direct Hardware Passthrough & Dev Mapping

By setting `share_hardware: true`, the container binds the host's `/dev` directory inside the sandbox. This gives the sandboxed execution script direct access to host GPU drivers (CUDA/NVIDIA), USB controllers, and physical interfaces without virtualization overhead or speed penalties.

---

## 4. Resource Allocation & Dynamic Load Balancing

Cluster-lang handles host system resources (CPU cores, RAM size, GPU availability, and storage devices) in two ways:

### 4.1 The Dynamic Resource Balancer
By default, the compiler hosts a background resource load balancer. If multiple containers are active simultaneously without specific limits:
* If **one container** is active, it receives up to 80-100% of PC resources.
* If **multiple containers** spin up, the balancer dynamically re-calculates and allocates shares of RAM and CPU weights to ensure fair slice distribution and prevent system resource starvation.

### 4.2 Manual Overrides & cgroups v2 Enforced Boundaries
Developers can override the dynamic resource balancer directly inside the `.clc` file to manually allocate strict kernel-enforced limits:

```yaml
# Manual resource overrides (cgroups v2 limits)
limit_cpu: 0.5           # Limit container execution to 0.5 CPU core quota
limit_memory: 128M       # Limit container memory footprint to 128MB
```

### 4.3 Network Namespace Isolation & Host Access Toggle
By default, a Cluster Container shares the host's network namespace. This ensures zero packet-routing overhead and JIT direct-to-hardware network performance, making guest database ports immediately accessible on `127.0.0.1`.

For complete network security and isolation, developers can enable network namespace isolation:

```yaml
isolate_network: true    # Unshares network namespace (CLONE_NEWNET)
```

* **Network isolation behavior:** Under network isolation, the runner unshares the net namespace and dynamically provisions and activates the guest loopback interface (`lo`). 
* **Toggling Host Access:** If a service (such as `memcached` or `redis`) has `isolate_network: true` enabled and you wish to expose it back to your host machine for development testing:
  1. Set `isolate_network: false` (or comment the line out) in your `.clc` recipe configuration.
  2. Forge the changes and start the sandbox:
     ```bash
     sudo ./cl-container install <recipe-name>
     sudo ./cl-container run <recipe-name>
     ```

### 4.4 Shared Host Libraries vs. Strict Isolation

To provide maximum memory efficiency, `clc` supports **Shared Page Cache Memory** by default.

```yaml
share_host_libs: true     # Mounts host /bin, /lib, /lib64, /usr (Default)
```

* **How it works:** When set to `true`, the runner mounts the host's operating system directories read-only. The Linux Kernel Page Cache shares dynamic libraries (like `libssl.so` or `libc.so`) in host physical RAM across all running containers, saving gigabytes of memory on high-density host servers.
* **Strict Isolation Mode:** If you are deploying containers on a host with a different Linux distribution (e.g. running an Alpine rootfs container on a Debian host), or you want absolute dependency isolation, disable host library sharing:
  ```yaml
  share_host_libs: false   # Strict sandbox isolation
  ```
  *Note: Under strict isolation, the container guest `rootfs` must contain its own system libraries, shell binaries (`/bin/sh`), and base operating system files.*

### 4.5 User Namespace Mapping (`userns`)

To enable rootless sandbox security, `clc` uses User Namespaces (`CLONE_NEWUSER`) by default:

```yaml
userns: true              # Maps guest root to host user (Default)
```

* **How it works:** User namespaces map the unprivileged host user's UID (e.g., `1000`) to UID `0` (root) inside the container namespace.
* **Benefits:**
  * **Root Privileges inside the guest:** The application runs as UID 0 (root) *inside* the container, allowing it to bind to privileged ports (under 1024) or execute internal mount commands.
  * **Zero Privileges outside the guest:** On the host system, the container has no root access or administrative rights. If a containerized application is compromised, the attacker is locked into the privileges of the unprivileged host user (UID 1000).

---

## 5. Mounting External Devices & Storage

Developers can attach external volumes, storage drives, or custom directories to their sandboxes:

```yaml
# Attach external hardware storage mounts (SSDs, NVMe, HDDs)
mount_external:
    "/media/nvme_drive" -> "/mnt/storage"
    "/media/usb" -> "/mnt/usb"
```

---

## 6. Recipe-Based Dynamic Local Forging

To avoid pulling heavy multi-gigabyte operating system container images, `clc` introduces a dual-mode package install system.

### 5.1 Ultra-Lightweight GitHub Recipes
Using the command-line tool, developers can run:
```bash
cl-container install gitea
```
This fetches a compressed package `<1KB` from GitHub containing the `.clc` configuration file and a simple installation shell script (e.g. `setup.sh`). 

The compiler provisions a local isolated vacuum sandbox, bind-mounts host build dependencies, and executes the installer commands *inside the sandbox* to forge/build the application stack locally.

### 5.2 Pre-Built Cache Fallback
If the host is not capable of compiling or lacks dependencies, the compiler automatically checks for pre-compiled, Zstandard-compressed rootfs archives (`.tar.zst`) for the target system architecture in GitHub releases. If found, it fetches the precompiled archive as a fast-cache fallback, extracting it instantly into the sandbox.

---

## 7. Comparison & Key Advantages: `.clc` vs. Docker

| Feature | Cluster Declarative `.clc` | Docker Compose YAML |
| :--- | :--- | :--- |
| **Code Size** | Very compact (No boilerplate, implicit mounts) | Verbose (Needs explicit volume & image mapping) |
| **Typing & Validation** | Compiled and checked at JIT time | Static, parsed at runtime |
| **Daemon Overhead** | Zero (Runs as standard host process) | Requires active Docker/Podman Daemon |
| **Cleanup Guarantee** | Self-destructs vacuum directory immediately | Requires manual prune/image deletion |
| **Host Privilege Model** | Automatic drop to invoker UID/GID | Runs as root inside VM or needs rootless setup |
| **Download Footprint** | Under 1KB for recipes (forged locally) | Hundreds of MBs / GBs of OS layers |

### 7.1 Architectural Advantages over Docker

* **Zero-Daemon Footprint:** Docker requires a background daemon (`dockerd`) running constantly, which consumes CPU and RAM even when no containers are active. Cluster Containers run as native Linux processes—when a container starts, it executes syscalls directly; when it stops, it leaves absolutely zero memory footprint.
* **JIT Compilation Safety:** A `.clc` file compiles directly into C++ and machine code. Syntax errors, missing directory bindings, or type mismatches are caught before execution, preventing runtime failures common in untyped YAML files.
* **Dynamic Resource load-balancing:** The compiler balances system limits dynamically across running sandboxes, allowing a single active container to consume 100% of resources and automatically scaling down slices as new sandboxes open.
* **Dynamic Privilege Dropping:** While namespaces are mounted using root privileges, the sandboxed process immediately drops its UID/GID to the invoking user, ensuring full write access to user files without posing system-wide security risks.

### 7.2 Host Desktop Mount Behavior
When mounting directories (like `/bin` or `/usr`) inside a container rootfs, Linux registers these as bind mounts.
* **Monitored Paths (e.g., `/media`):** Linux desktop environments (like GNOME/KDE/XFCE) use services like `udisks2` to actively monitor `/media` and `/run/media` for removable drives. If your container's `rootfs` is located under `/media`, the file manager will display each bind mount (like `bin`, `lib`) as a separate connected hard drive in your sidebar.
* **System Paths (e.g., `/var` or `/tmp`):** To avoid graphical desktop clutter, production containers are located under standard system paths like `/var/lib/clc/` or `/tmp/`. The desktop environment automatically ignores mounts in these paths, keeping your file manager sidebar completely clean. Once a running container is stopped (e.g., via `Ctrl+C`), the sandbox lazily unmounts all bindings and they disappear.

### 7.3 Case Study: Running a Self-Contained Database (PostgreSQL)
When launching database clusters inside a Cluster Container sandbox, the C++ runtime's automatic privilege-dropping model plays a key role:
1. **Dynamic Database Roles:** PostgreSQL initializes database clusters (`initdb`) using the current running OS user's credentials. Because `clc` automatically drops execution privileges to the invoking host user (e.g. `john`), the database's administrative super-user role will match `john`'s host username, and not the hardcoded default `postgres`.
2. **Access Commands:** When connecting to the running sandbox from the host via the command-line client (`psql`), you must pass the host username as the database user role:
   ```bash
   ./rootfs/opt/postgres/bin/psql -h 127.0.0.1 -U <your-host-username> -d postgres
   ```

### 7.4 Case Study: Utilizing Compiler and Runtime Environments (Python, Go, & Java)
For compiler and interpreter containers (such as `python-runtime`, `golang-compiler`, or `java-runtime`), the default execution command in the recipe (e.g., `python3 --version`, `go version`, or `java -version`) is configured as a simple startup sanity test. To leverage these containers for interactive development or building custom applications, developers can utilize two primary patterns:

1. **Interactive Shell Execution:**
   By modifying the `run:` directive in the `.clc` file to target a shell (such as `/bin/bash` or `/bin/sh`), the runner launches an interactive terminal inside the sandbox namespaces. The container remains active and only terminates when you type `exit`:
   ```yaml
   # runtimes/java/java.clc
   run:
       "/bin/bash"
   ```

2. **Mounting External Workspaces:**
   To build or execute host-side application source code within the compiler container, use the `mount_external:` block to bind-mount the host workspace directory, and update the execution target:
   ```yaml
   # runtimes/java/java.clc
   mount_external:
       "/home/user/my-java-app -> /app"

   run:
       "/opt/java/bin/javac /app/Main.java"
       "/opt/java/bin/java -cp /app Main"
   ```

---

## 8. Advanced Programmable Container Orchestration

For custom workflows that require loops, conditionals, or complex mount systems, developers can write raw Cluster-lang scripts (`.cl` or `.zk`) utilizing the low-level `container` namespace APIs:

```python
import std::container as container

fn execute_custom_sandbox(sandbox_path: string) -> int:
    c := container::create("custom-runner", sandbox_path, "custom-host")
    
    // Register auto-cleanup
    defer c.cleanup()
    
    c.provision_skeleton()
    
    // Dynamic bind mounts
    c.bind_mount("/bin", "/bin", true)
    c.bind_mount("/lib", "/lib", true)
    c.bind_mount("/lib64", "/lib64", true)
    c.bind_mount("/usr", "/usr", true)
    c.mount_proc()
    
    // Execute isolated task
    return c.run("/bin/sh -c 'echo Inside custom sandbox'")
```
