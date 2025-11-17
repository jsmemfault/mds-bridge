# Node.js MDS Example

This directory contains a Node.js example demonstrating how to use the Memfault Diagnostic Service (MDS) protocol with a custom backend.

## Architecture

This example implements the pluggable backend architecture:

- **Node-HID**: Wrapped in a custom backend class
- **C Library**: Calls back to JavaScript for HID I/O operations
- **JavaScript**: Implements backend interface, uses high-level MDS API

**Benefits:**
- Cleaner, simpler code
- Transport-agnostic design (works with HID, Serial, BLE, etc.)
- No manual buffer management or protocol details exposed
- Uses high-level MDS API
- Demonstrates pluggable architecture

## Files

- `package.json` - Node.js dependencies and build scripts
- `bindings.js` - FFI bindings to the C library
- `node-hid-backend.js` - Custom backend implementing MDS backend interface
- `mds-client.js` - MDS client using custom backend
- `index.js` - Example application
- `README.md` - This file

## Prerequisites

1. **Build the C library first:**

```bash
cd ../..
cmake -B build -DBUILD_SHARED_LIBS=ON
cmake --build build
```

This creates the shared library:
- macOS: `build/libmemfault_hid.dylib`
- Linux: `build/libmemfault_hid.so`
- Windows: `build/memfault_hid.dll`

2. **Install Node.js dependencies:**

```bash
cd examples/nodejs
npm install
```

## Configuration

Edit `index.js` and update the CONFIG section with your device's VID/PID:

```javascript
const CONFIG = {
  vendorId: 0x1234,    // Your device's Vendor ID
  productId: 0x5678,   // Your device's Product ID
  uploadChunks: true,  // Enable/disable cloud uploads
};
```

## Running the Example

```bash
npm start
```

The application will:

1. Connect to your HID device
2. Initialize the MDS client
3. Read device configuration (device ID, URI, auth)
4. Enable diagnostic data streaming
5. Process incoming transport data:
   - MDS client automatically handles MDS protocol data
   - Custom reports are passed to your application logic
6. Optionally upload chunks to Memfault cloud

Press `Ctrl+C` to stop gracefully.

## How It Works

### 1. Custom Backend Implementation

The `NodeHIDBackend` class implements the MDS backend interface using node-hid:

```javascript
class NodeHIDBackend {
  constructor(hidDevice) {
    this.device = hidDevice;

    // Create callbacks that the C library will invoke for HID I/O
    const readCallback = ffi.Callback(..., (impl_data, report_id, buffer, length, timeout_ms) => {
      return this._handleRead(report_id, buffer, length, timeout_ms);
    });

    const writeCallback = ffi.Callback(..., (impl_data, report_id, buffer, length) => {
      return this._handleWrite(report_id, buffer, length);
    });

    // Create backend structure with operations
    this.backend = new mds_backend_t({
      ops: new mds_backend_ops_t({ read: readCallback, write: writeCallback }),
      impl_data: voidPtr.NULL,
    });
  }

  _handleRead(report_id, buffer, length, timeout_ms) {
    // Feature reports (0x01-0x05)
    const data = this.device.getFeatureReport(report_id, length);
    data.slice(1).copy(buffer);  // Copy to C buffer
    return data.length - 1;
  }

  _handleWrite(report_id, buffer, length) {
    // Write feature reports
    this.device.write([report_id, ...buffer]);
    return length;
  }
}
```

### 2. MDS Session with Custom Backend

The MDS client creates a session using the custom backend:

```javascript
const backend = new NodeHIDBackend(device);
const sessionPtr = ref.alloc(mds_session_ptr);
lib.mds_session_create(backend.getBackendRef(), sessionPtr);
const session = sessionPtr.deref();

// Use high-level API - C library calls our backend for HID I/O
const config = new mds_device_config_t();
lib.mds_read_device_config(session, config.ref());

// Enable streaming
lib.mds_stream_enable(session);
```

### 3. Processing Transport Data (Transport-Agnostic API)

The MDS client provides a clean, transport-agnostic API for processing data:

```javascript
// Set up chunk callback
mdsClient.setChunkCallback(async (packet) => {
  console.log(`Received chunk: seq=${packet.sequence}, len=${packet.length} bytes`);
  await mdsClient.uploadChunk(packet.data);
});

// Process incoming data
device.on('data', (data) => {
  // Let MDS process first - returns true if it handled the data
  if (mdsClient.process(Buffer.from(data))) {
    return;  // MDS handled it internally
  }

  // Not MDS data - handle as custom report
  handleCustomReport(data);
});
```

**For multiplexed transports (HID, Serial):**
- Use `process(data)` where `data[0]` is the channel/report ID
- Returns `true` if MDS handled it, `false` if it's for your application

**For pre-demultiplexed transports (BLE GATT characteristics):**
- Use `processStreamData(payload)` when receiving from the MDS characteristic
- No channel ID prefix needed (characteristic UUID already identifies it as MDS data)

## Example Output

```
============================================================
Memfault HID + MDS Example Application
============================================================

Looking for HID device (VID: 0x1234, PID: 0x5678)...
Found device: Example Manufacturer Example Product
  Path: /dev/hidraw0

MDS Device Configuration:
  Device ID: DEVICE-12345
  Data URI: https://chunks.memfault.com/api/v0/chunks/PROJ_KEY
  Auth: Memfault-Project-Key:abc123...
  Features: 0x0

[MDS] Streaming enabled

Application running. Press Ctrl+C to exit.

[MDS] Chunk received: seq=0, len=63 bytes
[MDS] Chunk uploaded successfully
[CustomApp] Performing periodic task...
[MDS] Chunk received: seq=1, len=63 bytes
[MDS] Chunk uploaded successfully

[Stats] Chunks: 15 received, 15 uploaded, Custom reports: 3
```

## Integrating with Your Application

To use MDS in your existing Node.js HID application:

1. **Add the required files to your project:**
   - Copy `bindings.js`, `node-hid-backend.js`, and `mds-client.js` to your project
   - Install dependencies: `npm install ffi-napi ref-napi ref-struct-napi ref-array-napi node-hid`

2. **Create an MDS client instance:**
   ```javascript
   import HID from 'node-hid';
   import { MDSClient } from './mds-client.js';

   const device = new HID.HID(devicePath);
   const mdsClient = new MDSClient(device);
   await mdsClient.initialize();
   ```

3. **Set up chunk callback:**
   ```javascript
   mdsClient.setChunkCallback(async (packet) => {
     console.log(`Received chunk: ${packet.length} bytes`);
     await mdsClient.uploadChunk(packet.data);
   });
   ```

4. **Enable streaming:**
   ```javascript
   await mdsClient.enableStreaming();
   ```

5. **Process incoming transport data:**
   ```javascript
   device.on('data', (data) => {
     // Let MDS process first - returns true if it handled the data
     if (mdsClient.process(Buffer.from(data))) {
       return;  // MDS handled it internally
     }

     // Not MDS data - handle as custom report
     handleCustomReport(data);
   });
   ```

## Creating Custom Backends

You can implement backends for other transports (Serial, BLE, etc.) by following the same pattern:

1. **Implement the backend interface:**
   ```javascript
   class CustomBackend {
     constructor(transport) {
       this.transport = transport;

       // Create read/write callbacks
       const readCallback = ffi.Callback('int', [...], (impl_data, report_id, buffer, length, timeout_ms) => {
         // Read from your transport
         const data = this.transport.read(report_id, length);
         data.copy(buffer);
         return data.length;
       });

       const writeCallback = ffi.Callback('int', [...], (impl_data, report_id, buffer, length) => {
         // Write to your transport
         this.transport.write(report_id, buffer);
         return length;
       });

       // Create backend structure
       this.backend = new mds_backend_t({
         ops: new mds_backend_ops_t({ read: readCallback, write: writeCallback }),
         impl_data: voidPtr.NULL,
       });
     }

     getBackendRef() {
       return this.backend.ref();
     }
   }
   ```

2. **Use it with MDS:**
   ```javascript
   const backend = new CustomBackend(myTransport);
   const sessionPtr = ref.alloc(mds_session_ptr);
   lib.mds_session_create(backend.getBackendRef(), sessionPtr);
   ```

## API Reference

### MDSClient

#### Constructor
```javascript
new MDSClient(hidDevice)
```

#### Methods

- `async initialize()` - Initialize MDS session and read device config
- `async readDeviceConfig()` - Read device configuration from device
- `async enableStreaming()` - Enable diagnostic data streaming
- `async disableStreaming()` - Disable streaming
- `process(data)` - Process transport data (multiplexed transports like HID/Serial), returns boolean
- `processStreamData(payload)` - Process MDS stream payload (pre-demultiplexed transports like BLE)
- `async uploadChunk(chunkData)` - Upload chunk data to Memfault cloud
- `setChunkCallback(callback)` - Set callback for received chunks
- `getConfig()` - Get device configuration
- `isStreaming()` - Check if streaming is enabled
- `destroy()` - Clean up resources

## Troubleshooting

### Library not found

If you get an error loading the library:

1. Make sure you built the C library: `npm run build:lib`
2. Check that the library exists in `../../build/`
3. Verify the library path in `bindings.js` matches your platform

### Device not found

1. Run with any VID/PID to see available devices
2. Update CONFIG with your device's actual VID/PID
3. Ensure you have permissions to access HID devices (may need sudo on Linux)

### FFI errors

Make sure all dependencies are installed:

```bash
npm install
```

If you're on macOS with Apple Silicon, you may need to rebuild native modules:

```bash
npm rebuild
```

## License

MIT
