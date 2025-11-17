/**
 * @file mds_protocol_internal.h
 * @brief Internal MDS Protocol APIs for FFI Bindings
 *
 * This header contains internal APIs that are primarily used by FFI language
 * bindings (Python ctypes, Node.js ffi-napi, etc.) for event-driven I/O.
 *
 * These APIs expose low-level protocol details and should NOT be used by
 * typical C applications. Instead, use the high-level APIs in mds_protocol.h.
 *
 * Why these exist:
 * - FFI libraries (hidapi, node-hid) use non-blocking, event-driven I/O
 * - The main C API uses blocking reads via the backend interface
 * - These buffer-based parsing functions bridge the impedance mismatch
 * - They allow FFI code to parse packets received via callbacks/events
 */

#ifndef MEMFAULT_MDS_PROTOCOL_INTERNAL_H
#define MEMFAULT_MDS_PROTOCOL_INTERNAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include "mds_protocol.h"

/* ============================================================================
 * Buffer-based Parsing API (Internal - For FFI Use Only)
 * ========================================================================== */

/**
 * @brief Parse stream data packet from buffer
 *
 * Internal function for FFI bindings to parse stream packets received
 * via event-driven I/O (e.g., hidapi callbacks, node-hid events).
 *
 * @param buffer Input report data (without Report ID prefix)
 * @param buffer_len Length of buffer
 * @param packet Pointer to receive parsed packet
 *
 * @return 0 on success, negative error code otherwise
 *
 * @note This is an internal API. C applications should use mds_stream_read_packet()
 */
int mds_parse_stream_packet(const uint8_t *buffer, size_t buffer_len,
                             mds_stream_packet_t *packet);

/**
 * @brief Validate sequence number
 *
 * Internal function for FFI bindings to validate sequence numbers when
 * manually processing packets.
 *
 * @param prev_seq Previous sequence number
 * @param new_seq New sequence number
 *
 * @return true if sequence is valid (next in sequence)
 *         false if packet was dropped or duplicated
 *
 * @note This is an internal API. C applications using mds_stream_process()
 *       don't need to call this directly.
 */
bool mds_validate_sequence(uint8_t prev_seq, uint8_t new_seq);

/**
 * @brief Get last sequence number from session
 *
 * Internal function for FFI bindings to track sequence numbers.
 *
 * @param session MDS session handle
 *
 * @return Last received sequence number (0-31), or MDS_SEQUENCE_MAX if uninitialized
 *
 * @note This is an internal API. C applications don't need sequence tracking.
 */
uint8_t mds_get_last_sequence(mds_session_t *session);

/**
 * @brief Update last sequence number in session
 *
 * Internal function for FFI bindings to update sequence tracking after
 * successfully processing a packet.
 *
 * @param session MDS session handle
 * @param sequence New sequence number to store
 *
 * @note This is an internal API. C applications don't need sequence tracking.
 */
void mds_update_last_sequence(mds_session_t *session, uint8_t sequence);

/**
 * @brief Extract sequence number from packet byte 0
 *
 * Helper for extracting sequence from the first byte of a stream packet.
 *
 * @param byte0 First byte of stream packet
 *
 * @return Sequence number (0-31)
 */
static inline uint8_t mds_extract_sequence(uint8_t byte0) {
    return byte0 & MDS_SEQUENCE_MASK;
}

#ifdef __cplusplus
}
#endif

#endif /* MEMFAULT_MDS_PROTOCOL_INTERNAL_H */
