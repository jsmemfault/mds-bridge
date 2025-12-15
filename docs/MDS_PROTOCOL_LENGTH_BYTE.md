# MDS Protocol Change: Add Length Byte to Stream Packets

## Problem

The MDS protocol was originally designed for BLE, where each notification carries its actual byte count via the BLE stack. When adapted to USB HID, this implicit length information is lost because HID reports are fixed-size (64 bytes).

**Symptom**: Heartbeats and reboot events work fine, but coredumps are corrupted. The gateway concatenates all 63 bytes of each packet (including zero padding) as valid data, corrupting multi-packet payloads.

**Root cause**: No length field in the stream packet format. The gateway has no way to distinguish real data from padding.

## Solution

Add a payload length byte to the stream packet format.

---

## Protocol Specification

### Previous Format (Report ID 0x06)

```
Offset  Size  Description
------  ----  -----------
0       1     Sequence number (bits 0-4), Reserved (bits 5-7)
1       63    Chunk data payload (ALL bytes treated as valid)
```

Total: 64 bytes (including report ID sent separately or prepended depending on transport)

### New Format (Report ID 0x06)

```
Offset  Size  Description
------  ----  -----------
0       1     Sequence number (bits 0-4), Reserved (bits 5-7)
1       1     Payload length (1-61, number of valid data bytes following)
2       61    Chunk data payload (only first `length` bytes are valid)
```

Total: 64 bytes (including report ID which is byte 0 of the HID report)

**Key changes:**
- Byte 1 is now the payload length (was first data byte)
- Data starts at byte 2 (was byte 1)
- Maximum payload per packet is 61 bytes (was 63)

---

## Device-Side Implementation

### HID Report Building

When constructing an MDS stream data HID report:

```c
#define MDS_REPORT_ID_STREAM_DATA  0x06
#define MDS_MAX_PAYLOAD_LEN        61    // Reduced from 63 (report[0]=ID, [1]=seq, [2]=len, [3-63]=data)

static uint8_t s_sequence_number = 0;

void mds_send_chunk(const uint8_t *chunk_data, size_t chunk_len) {
    uint8_t report[64];

    // Clamp payload to max size
    if (chunk_len > MDS_MAX_PAYLOAD_LEN) {
        chunk_len = MDS_MAX_PAYLOAD_LEN;
    }

    // Build report
    report[0] = MDS_REPORT_ID_STREAM_DATA;   // 0x06
    report[1] = s_sequence_number & 0x1F;    // Sequence (bits 0-4)
    report[2] = (uint8_t)chunk_len;          // NEW: Payload length

    // Copy chunk data starting at byte 3
    memcpy(&report[3], chunk_data, chunk_len);

    // Zero-pad remainder (gateway will ignore based on length byte)
    if (chunk_len < MDS_MAX_PAYLOAD_LEN) {
        memset(&report[3 + chunk_len], 0, MDS_MAX_PAYLOAD_LEN - chunk_len);
    }

    s_sequence_number = (s_sequence_number + 1) & 0x1F;  // Wrap at 32

    // Send via HID (implementation-specific)
    hid_send_report(report, sizeof(report));
}
```

### Integration with Memfault Packetizer

When calling `memfault_packetizer_get_chunk()`:

```c
void mds_export_chunks(void) {
    uint8_t chunk_buf[MDS_MAX_PAYLOAD_LEN];  // 61 bytes max now
    size_t chunk_len;

    while (memfault_packetizer_get_chunk(chunk_buf, &chunk_len)) {
        mds_send_chunk(chunk_buf, chunk_len);

        // Small delay between packets if needed for flow control
        // k_msleep(10);
    }
}
```

### HID Report Descriptor

If your HID report descriptor specifies report sizes, ensure Report ID 0x06 still declares 64 bytes total (or 63 bytes payload after report ID, depending on your descriptor structure). The internal format change doesn't affect the HID descriptor.

---

## Gateway-Side Implementation

The mds-bridge library will be updated to parse the length byte. Key changes:

### mds_protocol.h

```c
// Maximum chunk data per packet (after sequence and length bytes)
#define MDS_MAX_CHUNK_DATA_LEN  61  // Changed from 63
```

### mds_protocol.c - Packet Parsing

```c
static int mds_parse_stream_packet(const uint8_t *buffer, size_t buffer_len,
                                    mds_stream_packet_t *packet) {
    if (buffer == NULL || packet == NULL) {
        return -EINVAL;
    }

    // Need at least sequence byte + length byte
    if (buffer_len < 2) {
        return -EINVAL;
    }

    // Extract sequence number from byte 0
    packet->sequence = buffer[0] & 0x1F;

    // Extract payload length from byte 1
    uint8_t payload_len = buffer[1];

    // Validate payload length
    if (payload_len > MDS_MAX_CHUNK_DATA_LEN || payload_len == 0) {
        return -EINVAL;
    }

    // Verify buffer has enough data
    if (buffer_len < (size_t)(2 + payload_len)) {
        return -EINVAL;
    }

    packet->data_len = payload_len;

    // Copy only the valid payload bytes (starting at byte 2)
    memcpy(packet->data, &buffer[2], packet->data_len);

    return 0;
}
```

---

## Testing

After implementing changes on both sides:

1. **Verify heartbeats still work** - small payloads should still transfer correctly
2. **Verify reboot events still work** - single-packet events
3. **Test coredump transfer** - multi-packet payloads should now arrive intact
4. **Check Memfault processing** - uploaded chunks should decode without "incomplete stacktrace" warnings

### Debug Tip

Add logging on the gateway side to verify length bytes:

```c
printf("[MDS] Packet: seq=%u, len=%u, first_bytes=[%02X %02X %02X...]\n",
       packet->sequence, packet->data_len,
       packet->data[0], packet->data[1], packet->data[2]);
```

---

## Version Compatibility

This is a breaking protocol change. Devices with the old format will not work correctly with gateways expecting the new format (and vice versa).

If you need to support both, you could:
1. Add a feature flag to `MDS_REPORT_ID_SUPPORTED_FEATURES` (0x01) indicating "protocol v2"
2. Have the gateway check this flag and adapt parsing accordingly

For simplicity, we recommend updating device and gateway together.

---

## References

- Memfault MDS BLE Specification (length communicated via BLE MTU)
- mds-bridge source: `src/mds_protocol.c`
- Memfault Firmware SDK: `components/include/memfault/core/data_packetizer.h`
