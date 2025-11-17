# MDS Examples

Command-line tools for working with Memfault Diagnostic Service (MDS) over HID.

## Overview

This directory contains two main examples:

- **mds_monitor** - Monitor and display MDS stream data in real-time
- **mds_gateway** - Forward diagnostic chunks to Memfault cloud

Both examples demonstrate the full MDS workflow:
1. Connect to HID device
2. Read MDS device configuration
3. Enable diagnostic data streaming
4. Process stream packets

## Building

All examples are built automatically:

```bash
cd /path/to/memfault-cloud-hid
cmake -B build
cmake --build build
```

The executables will be in `build/examples/`.

---

## mds_gateway

Gateway for uploading diagnostic chunks to Memfault cloud.

### Purpose

- Upload diagnostic data to Memfault cloud via HTTP
- Production gateway for continuous monitoring
- Dry-run mode for testing without uploading

### Usage

#### Upload to Memfault Cloud (Default)

```bash
./mds_gateway 2fe3 0007
```

#### Dry-Run Mode (Print Without Uploading)

```bash
./mds_gateway 2fe3 0007 --dry-run
```

Replace `2fe3` and `0007` with your device's Vendor ID and Product ID (in hexadecimal).

### Example Output

#### Normal Mode (Uploading)

```
=========================================
Memfault MDS Gateway
=========================================

Initializing HID library...
Opening device 2FE3:0007...
Device opened successfully

Creating MDS session...
Reading device configuration...

--- Device Configuration ---
Device ID:     DEVICE-ABC-12345
Data URI:      https://chunks.memfault.com/api/v0/chunks/PROJECT_KEY
Authorization: Memfault-Project-Key:YOUR_PROJECT_KEY
Features:      0x0000001F
----------------------------

Setting up HTTP uploader (libcurl)...
HTTP uploader configured

Enabling diagnostic data streaming...
Streaming enabled

=========================================
Gateway running. Press Ctrl+C to stop.
=========================================

Processed chunk #1
* Uploading to https://chunks.memfault.com/api/v0/chunks/PROJECT_KEY
* HTTP 202 Accepted
  Total uploaded: 1 chunks, 128 bytes

Processed chunk #2
* Uploading to https://chunks.memfault.com/api/v0/chunks/PROJECT_KEY
* HTTP 202 Accepted
  Total uploaded: 2 chunks, 256 bytes

^C
Shutting down...

--- Upload Statistics ---
Chunks uploaded:   2
Bytes uploaded:    256
Upload failures:   0
Last HTTP status:  202
-------------------------
```

#### Dry-Run Mode

```
DRY RUN mode - chunks will be printed but NOT uploaded

...

[DRY RUN] Chunk #1 (not uploading)
  URI: https://chunks.memfault.com/api/v0/chunks/PROJECT_KEY
  Auth: Memfault-Project-Key:YOUR_PROJECT_KEY
  Size: 128 bytes
  Data: 02 01 4D 46 4C 54 01 07 00 00 00 00 00 00 00 00 ... (128 bytes total)

[DRY RUN] Chunk #2 (not uploading)
  URI: https://chunks.memfault.com/api/v0/chunks/PROJECT_KEY
  Auth: Memfault-Project-Key:YOUR_PROJECT_KEY
  Size: 128 bytes
  Data: A3 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F ... (128 bytes total)

^C
Shutting down...

--- Dry Run Statistics ---
Chunks processed: 2
(Not uploaded - dry run mode)
--------------------------
```

### Features

- **HTTP Upload**: Uses libcurl to POST chunks to Memfault cloud
- **Automatic Retry**: Continues on timeout or temporary errors
- **Statistics**: Tracks uploaded chunks, bytes, failures, and HTTP status
- **Verbose Mode**: Shows detailed upload progress
- **Graceful Shutdown**: Ctrl+C cleanly disables streaming and shows final stats

### Options

- `--dry-run` - Print chunks without uploading to cloud (useful for testing)

---

## mds_monitor

Real-time monitor for MDS stream data.

### Purpose

- Debug MDS streaming functionality
- Inspect diagnostic data packets
- Verify sequence numbering
- Measure streaming throughput
- Test device MDS implementation

### Usage

#### Interactive Mode

Lists all available HID devices and lets you select one:

```bash
./mds_monitor
```

#### Specify Device by VID/PID

Connect directly to a device with known VID/PID:

```bash
./mds_monitor 0x1234 0x5678
```

Replace `0x1234` and `0x5678` with your device's Vendor ID and Product ID (in hexadecimal).

### Example Output

```
============================================================
Memfault MDS Stream Monitor
============================================================

Found device: Acme Corp Device Pro
Device opened successfully!
MDS session created.

MDS Device Configuration:
  Device ID:   DEVICE-ABC-12345
  Data URI:    https://chunks.memfault.com/api/v0/chunks/PROJECT_KEY
  Auth:        Memfault-Project-Key:YOUR_PROJECT_KEY
  Features:    0x0000001F

Enabling MDS streaming...
Streaming enabled!
Monitoring MDS stream... (Press Ctrl+C to stop)
============================================================

[12.345] MDS Stream Packet
  Sequence:   0 (0x00)
  Data Len:   63 bytes
  Data:       02 01 4D 46 4C 54 01 07 00 00 00 00 00 00 00 00
              00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
              ...

[12.456] MDS Stream Packet
  Sequence:   1 (0x01)
  Data Len:   63 bytes
  Data:       A3 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
              ...

[Stats] Packets: 50, Bytes: 3150, Seq errors: 0, Elapsed: 10 sec

^C
Shutting down...

Final Statistics:
  Packets received:  157
  Bytes received:    9891
  Sequence errors:   0
  Elapsed time:      32 seconds
  Throughput:        309.09 bytes/sec

Goodbye!
```

### Features

#### Real-time Packet Display

Each MDS stream packet is displayed with:
- Timestamp (monotonic clock)
- Sequence number (0-31, wrapping)
- Data length
- Hex dump of packet data

#### Sequence Validation

The monitor validates that sequence numbers increment correctly and warns if packets are dropped:

```
  WARNING: Sequence error! Expected 5, got 7
```

#### Statistics

Periodic and final statistics include:
- Total packets received
- Total bytes received
- Number of sequence errors detected
- Elapsed time
- Average throughput (bytes/sec)

#### Graceful Shutdown

Press `Ctrl+C` to stop monitoring. The tool will:
1. Disable MDS streaming on the device
2. Print final statistics
3. Clean up resources properly

### Notes

- The monitor reads packets with a 100ms timeout for responsiveness
- Timeouts are normal when no data is being streamed
- Sequence numbers wrap from 31 back to 0
- The tool only displays stream data; it does not upload to Memfault cloud

---

## Comparison

| Feature | mds_monitor | mds_gateway |
|---------|-------------|-------------|
| **Purpose** | Debug/inspect stream data | Upload to Memfault cloud |
| **Upload to Cloud** | No | Yes (default) |
| **Dry-Run Mode** | N/A (always dry-run) | Yes (`--dry-run` flag) |
| **Packet Display** | Detailed hex dump | Summary only |
| **Sequence Validation** | Yes | No |
| **Statistics** | Packets, bytes, throughput | Chunks, bytes, HTTP status |
| **Best For** | Development, debugging | Production, continuous monitoring |

---

## Troubleshooting

### No devices found

Make sure:
- Your device is plugged in
- You have permissions to access HID devices (may need `sudo` on Linux)
- The device is not already opened by another application

### Failed to enable streaming

The device may not support MDS or may not be configured correctly. Check:
- Device firmware implements MDS protocol
- Device is in the correct mode for streaming

### No packets received

The device may not have diagnostic data to send. Try:
- Generating events on the device
- Checking device logs
- Verifying the device MDS implementation

### Upload failures (mds_gateway)

If chunks fail to upload:
- Check network connectivity
- Verify the project key in device configuration
- Check Memfault cloud status
- Review HTTP status codes in statistics

---

## Protocol Details

Both tools implement the Memfault Diagnostic Service (MDS) protocol:

1. **Device Configuration** (Feature Reports):
   - Supported Features (0x01)
   - Device ID (0x02)
   - Data URI (0x03)
   - Authorization (0x04)

2. **Stream Control** (Feature Report 0x05):
   - Enable streaming (mode = 0x01)
   - Disable streaming (mode = 0x00)

3. **Stream Data** (Input Report 0x06):
   - Sequence number (0-31, wrapping)
   - Diagnostic chunk data

---

## Language Bindings

Additional examples are available for other languages:

- **nodejs/** - Node.js examples using node-hid
- **python/** - Python examples using hidapi

See the respective directories for language-specific examples.
