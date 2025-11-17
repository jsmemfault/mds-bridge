/**
 * Node HID Backend - Implements MDS backend interface using node-hid
 *
 * This class demonstrates how to create a custom backend for the MDS protocol
 * using JavaScript and node-hid for HID operations. The backend is registered
 * with the C library via FFI, allowing the C code to call back into JavaScript
 * for HID I/O operations.
 */

import {
  ref,
  voidPtr,
  ffi,
  mds_backend_ops_t,
  mds_backend_t,
  MDS_REPORT_ID,
} from './bindings.js';

/**
 * Node HID Backend - Bridges node-hid with MDS backend interface
 */
export class NodeHIDBackend {
  /**
   * @param {Object} hidDevice - node-hid device instance
   */
  constructor(hidDevice) {
    this.device = hidDevice;
    this.backend = null;
    this.ops = null;

    // Create backend callbacks
    this._createBackend();
  }

  /**
   * Create the backend structure with C callbacks
   * @private
   */
  _createBackend() {
    // Create read callback - the C library will call this to read HID reports
    const readCallback = ffi.Callback(
      'int',
      [voidPtr, 'uint8', ref.refType('uint8'), 'size_t', 'int'],
      (impl_data, report_id, buffer, length, timeout_ms) => {
        try {
          return this._handleRead(report_id, buffer, length, timeout_ms);
        } catch (error) {
          console.error('Backend read error:', error);
          return -5; // -EIO
        }
      }
    );

    // Create write callback - the C library will call this to write HID reports
    const writeCallback = ffi.Callback(
      'int',
      [voidPtr, 'uint8', ref.refType('uint8'), 'size_t'],
      (impl_data, report_id, buffer, length) => {
        try {
          return this._handleWrite(report_id, buffer, length);
        } catch (error) {
          console.error('Backend write error:', error);
          return -5; // -EIO
        }
      }
    );

    // Create destroy callback (no-op for Node backend)
    const destroyCallback = ffi.Callback('void', [voidPtr], (impl_data) => {
      console.log('Backend destroy called (no-op for Node backend)');
    });

    // Create ops structure
    this.ops = new mds_backend_ops_t({
      read: readCallback,
      write: writeCallback,
      destroy: destroyCallback,
    });

    // Create backend structure
    this.backend = new mds_backend_t({
      ops: this.ops.ref(),
      impl_data: voidPtr.NULL, // We don't need impl_data since we use 'this'
    });

    // Keep callbacks alive (prevent garbage collection)
    this._keepAlive = [readCallback, writeCallback, destroyCallback];
  }

  /**
   * Handle read operation from C library
   * @private
   */
  _handleRead(report_id, buffer, length, timeout_ms) {
    console.log(`[Node Backend] READ request: report_id=0x${report_id.toString(16)}, length=${length}, timeout=${timeout_ms}ms`);

    // Determine if this is a feature report (0x01-0x05) or input report (0x06)
    if (report_id >= MDS_REPORT_ID.SUPPORTED_FEATURES &&
        report_id <= MDS_REPORT_ID.STREAM_CONTROL) {
      // Feature report - use getFeatureReport()
      const data = this.device.getFeatureReport(report_id, length);

      if (!data || data.length < 2) {
        console.error('[Node Backend] Failed to read feature report');
        return -5; // -EIO
      }

      // Copy data to C buffer (skip report ID byte)
      const dataWithoutReportId = Buffer.from(data.slice(1));
      const bytesToCopy = Math.min(dataWithoutReportId.length, length);
      dataWithoutReportId.copy(buffer, 0, 0, bytesToCopy);

      console.log(`[Node Backend] Feature report read: ${bytesToCopy} bytes`);
      return bytesToCopy;

    } else if (report_id === MDS_REPORT_ID.STREAM_DATA) {
      // Input report - this should be handled via the data event in the application
      // For blocking reads, we would need to implement a queue
      // For now, return EAGAIN (would block)
      console.log('[Node Backend] Input report read requested (use event-based approach)');
      return -11; // -EAGAIN

    } else {
      console.error(`[Node Backend] Unknown report ID: 0x${report_id.toString(16)}`);
      return -22; // -EINVAL
    }
  }

  /**
   * Handle write operation from C library
   * @private
   */
  _handleWrite(report_id, buffer, length) {
    console.log(`[Node Backend] WRITE request: report_id=0x${report_id.toString(16)}, length=${length}`);

    // Feature reports use setFeatureReport (Report ID 0x05 - stream control)
    if (report_id === MDS_REPORT_ID.STREAM_CONTROL) {
      try {
        // Copy data from C buffer to JS buffer
        const data = Buffer.alloc(length);
        for (let i = 0; i < length; i++) {
          data[i] = buffer[i];
        }

        // node-hid write() expects [report_id, ...data]
        const report = Buffer.concat([Buffer.from([report_id]), data]);
        this.device.write(Array.from(report));

        console.log(`[Node Backend] Feature report written: ${length} bytes`);
        return length;
      } catch (error) {
        console.error('[Node Backend] Write failed:', error);
        return -5; // -EIO
      }
    } else {
      console.error(`[Node Backend] Unsupported write to report ID: 0x${report_id.toString(16)}`);
      return -22; // -EINVAL
    }
  }

  /**
   * Get the backend structure for passing to mds_session_create()
   */
  getBackendStruct() {
    return this.backend;
  }

  /**
   * Get the backend reference (pointer)
   */
  getBackendRef() {
    return this.backend.ref();
  }

  /**
   * Destroy the backend (cleanup)
   */
  destroy() {
    // Nothing to do for Node backend
    // The HID device is managed by the application
  }
}
